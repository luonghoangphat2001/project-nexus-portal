"""Run isolated Module 11–13 HTTP test cases against localhost + MySQL.

Requires Python requests. Creates QA-prefixed records; never resets existing data.
Usage: python scripts/qa_defense_localhost.py [--setup-only]
Evidence excludes JWTs and passwords. Test accounts use the development password.
"""
import argparse
import base64
import concurrent.futures
import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

BASE = "http://localhost:8080/api"
TZ = timezone(timedelta(hours=7))
PASSWORD = "password123"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "be" / "target" / "localhost-qa"
OUT.mkdir(parents=True, exist_ok=True)
RESULTS = []


def call(session, method, path, expected=200, **kwargs):
    response = session.request(method, BASE + path, timeout=30, **kwargs)
    body = response.json()
    assert response.status_code == expected, (
        f"{method} {path}: expected {expected}, received {response.status_code}: {body}"
    )
    return body.get("data") if expected < 300 else body


def login(username):
    session = requests.Session()
    data = call(session, "POST", "/auth/login", json={
        "usernameOrEmail": username, "password": PASSWORD,
    })
    session.headers["Authorization"] = "Bearer " + data["accessToken"]
    return session


def check(case_id, description, action):
    started = datetime.now(TZ).isoformat()
    try:
        detail = action()
        RESULTS.append(dict(id=case_id, description=description, status="PASS",
                            executedAt=started, detail=detail))
        print(f"PASS {case_id}: {description}", flush=True)
        return detail
    except Exception as error:
        RESULTS.append(dict(id=case_id, description=description, status="FAIL",
                            executedAt=started, detail=str(error)))
        print(f"FAIL {case_id}: {error}", flush=True)
        raise


def require(condition, detail):
    assert condition, detail
    return detail


def verify_second_report(session, registration_id):
    created = upload(session, registration_id)
    history = call(session, "GET", f"/reports/registrations/{registration_id}/documents")
    versions = sorted(d["version"] for d in history if d["type"] == "REPORT")
    return require(created["version"] == 2 and versions == [1, 2], "History contains report versions 1 and 2")


def upload(session, registration_id, name="qa-report.txt", content=b"QA report\n", kind="REPORT", title="QA Report", expected=201):
    return call(session, "POST", f"/reports/registrations/{registration_id}/documents",
                expected, data={"type": kind, "title": title, "note": "Localhost functional QA"},
                files={"file": (name, content, "application/octet-stream")})


def setup():
    stamp = datetime.now(TZ).strftime("%Y%m%d_%H%M%S")
    admin = login("superadmin")
    users = {}
    for key, role, department in [
        ("leader", "USER", 1), ("chair", "TEACHER", 1),
        ("secretary", "TEACHER", 1), ("reviewer", "TEACHER", 1),
        ("outsider", "PRINCIPAL", 2),
    ]:
        name = f"qa_{key}_{stamp}"
        payload = dict(username=name, email=f"{name}@example.test", password=PASSWORD,
                       fullName=f"QA {key.title()} {stamp}", roles=["ROLE_" + role],
                       departmentId=department, facultyId=1)
        if key == "leader":
            payload.update(cohortId=1, majorId=1, studentCode=f"QA{stamp}")
        user = call(admin, "POST", "/users", 201, json=payload)
        users[key] = dict(id=user["id"], username=name)
    sessions = {key: login(value["username"]) for key, value in users.items()}
    team = call(sessions["leader"], "POST", "/teams", 201,
                json=dict(name=f"QA Defense Team {stamp}", periodId=1))
    topic = call(sessions["secretary"], "POST", "/topics", 201, json=dict(
        title=f"QA Defense Workflow {stamp}", departmentId=1, periodId=1,
        type="CAPSTONE_PROJECT", maxStudents=1, majorIds=[1], description="Synthetic QA fixture",
    ))
    registration = call(sessions["leader"], "POST", "/registrations", 201,
                        json=dict(topicId=topic["id"], message="Synthetic QA fixture"))
    registration = call(admin, "PUT", f'/registrations/{registration["id"]}/review',
                        json=dict(status="APPROVED", feedback="Approved for localhost QA"))
    state = dict(runId=stamp, users=users, teamId=team["id"], topicId=topic["id"],
                 registrationId=registration["id"], frontend="http://localhost:3000",
                 backend=BASE, environment="MySQL 8 / Java 17 / production Vite preview")
    return state, admin, sessions


def run(state, admin, sessions):
    leader, reviewer, chair, secretary, outsider = [sessions[key] for key in
                                                   ["leader", "reviewer", "chair", "secretary", "outsider"]]
    reg = state["registrationId"]
    anonymous = requests.Session()
    check("AUTH-01", "Reports require JWT", lambda: call(anonymous, "GET", "/reports/registrations", 401))
    check("M11-01", "Approved QA registration is visible to leader", lambda: require(
        any(r["id"] == reg and r["canSubmit"] for r in call(leader, "GET", "/reports/registrations")), "Visible and canSubmit=true"))
    report = check("M11-02", "Upload first report", lambda: upload(leader, reg))
    check("M11-03", "Upload preserves versions", lambda: verify_second_report(leader, reg))
    check("M11-04", "Download matches original bytes", lambda: require(
        base64.b64decode(call(leader, "GET", f'/reports/documents/{report["id"]}/content')["base64"]) == b"QA report\n",
        "Downloaded content matches fixture"))
    check("M11-05", "Other document types have independent versions", lambda: require(
        all(upload(leader, reg, kind=kind)["version"] == 1 for kind in ["SLIDES", "SOURCE_CODE", "OTHER"]), "Each type version=1"))
    check("M11-06", "Reject unsupported file extension", lambda: upload(leader, reg, name="qa.exe", expected=400))
    check("M11-07", "Reject PDF with incorrect signature", lambda: upload(leader, reg, name="qa.pdf", expected=400))
    check("M11-08", "Reject empty file", lambda: upload(leader, reg, content=b"", expected=400))
    check("M11-09", "Reject file larger than 10 MiB", lambda: upload(leader, reg, content=b"a" * (10 * 1024 * 1024 + 1), expected=413))
    check("M11-10", "Reject blank document title", lambda: upload(leader, reg, title="", expected=422))
    unrelated_student = login("student2")
    check("M11-11", "Unrelated student cannot read QA documents", lambda: call(unrelated_student, "GET", f"/reports/registrations/{reg}/documents", 403))
    check("M11-12", "Other department principal cannot read QA report", lambda: call(outsider, "GET", f'/reports/documents/{report["id"]}/content', 403))
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        versions = sorted(pool.map(lambda _: upload(leader, reg)["version"], range(2)))
    check("M11-15", "Concurrent MySQL uploads allocate distinct versions", lambda: require(versions == [3, 4], f"Versions={versions}"))

    start = datetime.now(TZ).replace(tzinfo=None, microsecond=0) + timedelta(minutes=2)
    end = start + timedelta(minutes=1)
    payload = dict(name=f'QA API Council {state["runId"]}', departmentId=1, periodId=1,
                   room=f'QA-{state["runId"]}', startsAt=start.isoformat(), endsAt=end.isoformat(),
                   members=[dict(lecturerId=state["users"][key]["id"], role=role) for key, role in
                            [("chair", "CHAIR"), ("secretary", "SECRETARY"), ("reviewer", "REVIEWER")]])
    check("M12-01", "Student cannot create council", lambda: call(leader, "POST", "/councils", 403, json=payload))
    check("M12-02", "Other department principal cannot create council", lambda: call(outsider, "POST", "/councils", 403, json=payload))
    invalid = {**payload, "members": [payload["members"][0]] * 3}
    check("M12-03", "Reject duplicate members", lambda: call(admin, "POST", "/councils", 400, json=invalid))
    council = check("M12-04", "Create council with valid roles and future schedule", lambda: call(admin, "POST", "/councils", 201, json=payload))
    cid = council["id"]
    state.update(councilId=cid, startsAt=payload["startsAt"], endsAt=payload["endsAt"])
    check("M12-05", "Reject overlapping room and members", lambda: call(admin, "POST", "/councils", 400, json={**payload, "name": "QA conflicting council"}))
    payload["name"] += " Updated"
    check("M12-06", "Edit council before assessments", lambda: call(admin, "PUT", f"/councils/{cid}", json=payload))
    council = check("M12-07", "Assign approved registration", lambda: call(admin, "POST", f"/councils/{cid}/assignments", json=dict(registrationId=reg)))
    aid = council["assignments"][0]["id"]
    check("M12-08", "Reject duplicate assignment", lambda: call(admin, "POST", f"/councils/{cid}/assignments", 400, json=dict(registrationId=reg)))
    check("M12-09", "Remove assignment before assessments", lambda: call(admin, "DELETE", f"/councils/{cid}/assignments/{aid}"))
    council = check("M12-10", "Reassign approved registration", lambda: call(admin, "POST", f"/councils/{cid}/assignments", json=dict(registrationId=reg)))
    aid = council["assignments"][0]["id"]
    state["assignmentId"] = aid
    check("M12-11", "Student sees own schedule and assignment", lambda: require(
        any(c["id"] == cid and not c["canManage"] and len(c["assignments"]) == 1 for c in call(leader, "GET", "/councils")), "Own schedule visible, canManage=false"))

    score = dict(assignmentId=aid, studentId=state["users"]["leader"]["id"], type="REVIEW",
                 contentScore=8.5, implementationScore=9, presentationScore=8,
                 strengths="Clear QA report", weaknesses="Synthetic data only", questions="Explain design",
                 comment="Synthetic QA assessment; no academic result")
    check("M13-01", "Students cannot read assessments", lambda: call(leader, "GET", f"/assessments?assignmentId={aid}", 403))
    check("M13-02", "Only assigned reviewer can create review", lambda: call(chair, "POST", "/assessments", 403, json=score))
    check("M13-03", "Reject score above 10", lambda: call(reviewer, "POST", "/assessments", 422, json={**score, "contentScore": 10.01}))
    check("M13-04", "Reject score with more than two decimals", lambda: call(reviewer, "POST", "/assessments", 422, json={**score, "contentScore": 8.123}))
    draft = check("M13-05", "Save review draft", lambda: call(reviewer, "POST", "/assessments", json=score))
    did = draft["id"]
    check("M13-06", "Update draft retains same record", lambda: require(call(reviewer, "POST", "/assessments", json={**score, "contentScore": 9})["id"] == did, "Same assessment ID"))
    check("M13-07", "Draft is private from other evaluator", lambda: require(call(chair, "GET", f"/assessments?assignmentId={aid}") == [], "Other evaluator sees no draft"))
    check("M13-08", "Other evaluator cannot delete draft", lambda: call(chair, "DELETE", f"/assessments/{did}", 403))
    check("M12-12", "Assessment prevents council structure change", lambda: call(admin, "PUT", f"/councils/{cid}", 400, json=payload))
    check("M12-13", "Assessment prevents assignment removal", lambda: call(admin, "DELETE", f"/councils/{cid}/assignments/{aid}", 400))
    check("M13-09", "Owner can delete own draft", lambda: call(reviewer, "DELETE", f"/assessments/{did}"))
    draft = call(reviewer, "POST", "/assessments", json={**score, "comment": ""})
    did = draft["id"]
    check("M13-10", "Submit requires nonblank comment", lambda: call(reviewer, "POST", f"/assessments/{did}/submit", 400))
    call(reviewer, "POST", "/assessments", json=score)
    defense = call(chair, "POST", "/assessments", json={**score, "type": "DEFENSE"})
    check("M13-11", "Defense cannot submit before scheduled start", lambda: call(chair, "POST", f'/assessments/{defense["id"]}/submit', 400))
    submitted = check("M13-12", "Submit review locks assessment", lambda: call(reviewer, "POST", f"/assessments/{did}/submit"))
    require(submitted["status"] == "SUBMITTED" and not submitted["canEdit"], "Review is locked")
    check("M13-13", "Reject editing submitted assessment", lambda: call(reviewer, "POST", "/assessments", 400, json=score))
    check("M13-14", "Reject deleting submitted assessment", lambda: call(reviewer, "DELETE", f"/assessments/{did}", 400))
    check("M11-13", "Submitted review blocks further upload", lambda: upload(leader, reg, expected=400))
    check("M11-14", "Leader canSubmit becomes false", lambda: require(
        not next(r for r in call(leader, "GET", "/reports/registrations") if r["id"] == reg)["canSubmit"], "canSubmit=false"))
    check("M13-15", "Other evaluator can read submitted review", lambda: require(
        any(s["id"] == did and s["status"] == "SUBMITTED" for s in call(secretary, "GET", f"/assessments?assignmentId={aid}")), "Submitted review visible"))
    check("M12-14", "Submitted assessment blocks cancellation", lambda: call(admin, "PATCH", f"/councils/{cid}/status", 400, json=dict(status="CANCELLED")))
    check("M12-15", "Council cannot complete before end", lambda: call(admin, "PATCH", f"/councils/{cid}/status", 400, json=dict(status="COMPLETED")))
    print(f"Waiting for real schedule: {start.isoformat()} +07:00", flush=True)
    while datetime.now(TZ).replace(tzinfo=None) < start:
        time.sleep(5)
    check("M13-16", "Chair submits defense after start", lambda: call(chair, "POST", f'/assessments/{defense["id"]}/submit'))
    draft = call(secretary, "POST", "/assessments", json={**score, "type": "DEFENSE"})
    check("M13-17", "Secretary submits defense", lambda: call(secretary, "POST", f'/assessments/{draft["id"]}/submit'))
    print(f"Waiting for council end: {end.isoformat()} +07:00", flush=True)
    while datetime.now(TZ).replace(tzinfo=None) < end:
        time.sleep(5)
    check("M12-18", "Council cannot complete with a missing defense sheet", lambda: call(admin, "PATCH", f"/councils/{cid}/status", 400, json=dict(status="COMPLETED")))
    draft = call(reviewer, "POST", "/assessments", json={**score, "type": "DEFENSE"})
    check("M13-18", "Reviewer submits final required defense sheet", lambda: call(reviewer, "POST", f'/assessments/{draft["id"]}/submit'))
    check("M12-16", "Complete council after end and all four required sheets", lambda: require(
        call(admin, "PATCH", f"/councils/{cid}/status", json=dict(status="COMPLETED"))["status"] == "COMPLETED", "Council COMPLETED"))
    check("M12-17", "Completed council cannot reopen", lambda: call(admin, "PATCH", f"/councils/{cid}/status", 400, json=dict(status="SCHEDULED")))
    state["finalStatus"] = "COMPLETED"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--setup-only", action="store_true", help="Create isolated fixtures for manual browser QA")
    args = parser.parse_args()
    state = {}
    try:
        state, admin, sessions = setup()
        print("QA fixtures: " + json.dumps(state, ensure_ascii=False), flush=True)
        if not args.setup_only:
            run(state, admin, sessions)
    finally:
        if state:
            evidence = dict(fixture=state, results=RESULTS, recordedAt=datetime.now(TZ).isoformat())
            path = OUT / f'{state["runId"]}.json'
            path.write_text(json.dumps(evidence, indent=2, ensure_ascii=False), encoding="utf-8")
            (OUT / "latest.json").write_text(json.dumps(evidence, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"Evidence: {path}", flush=True)

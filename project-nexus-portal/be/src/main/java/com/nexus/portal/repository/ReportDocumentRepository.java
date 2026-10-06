package com.nexus.portal.repository;
import com.nexus.portal.model.ReportDocument;
import com.nexus.portal.dto.response.ReportDocumentResponse;
import com.nexus.portal.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface ReportDocumentRepository extends JpaRepository<ReportDocument, Long> {
    @Query("select new com.nexus.portal.dto.response.ReportDocumentResponse(d.id, d.registration.id, d.type, d.title, d.note, "
            + "d.fileName, d.contentType, d.fileSize, d.version, d.submittedBy.fullName, d.createdAt) "
            + "from ReportDocument d where d.registration.id = :registrationId order by d.createdAt desc, d.id desc")
    List<ReportDocumentResponse> findMetadataByRegistrationId(Long registrationId);
    @Query("select coalesce(max(d.version), 0) from ReportDocument d where d.registration.id = :registrationId and d.type = :type")
    int findLastVersion(Long registrationId, DocumentType type);
}

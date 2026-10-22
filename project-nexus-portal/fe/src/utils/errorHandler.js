import { vi } from '../i18n/translations/vi';
import { en } from '../i18n/translations/en';

const dictionaries = {
  vi,
  en,
};

/**
 * Pattern-to-i18n-key registry
 */
const ERROR_KEY_RULES = [
  {
    pattern: /gvhd không được tham gia chấm hội đồng/i,
    key: 'errors.advisorCannotGradeCouncil',
  },
  // Auth
  {
    pattern: /account is temporarily locked|account temporarily locked|locked for 15 minutes/i,
    key: 'errors.accountLocked',
  },
  {
    pattern: /invalid username or password|authentication failed|bad credentials/i,
    key: 'errors.invalidCredentials',
  },
  {
    pattern: /access denied|insufficient role permissions|forbidden/i,
    key: 'errors.forbidden',
  },
  {
    pattern: /only students are permitted to join a team/i,
    key: 'errors.onlyStudentsTeam',
  },
  {
    pattern: /jwt expired|token has expired|session expired/i,
    key: 'errors.unauthorized',
  },

  // Team
  {
    pattern: /already belongs to an active team|already belong to team|already belong to a team/i,
    key: 'errors.alreadyInTeam',
  },
  {
    pattern: /team is locked and cannot add new members|target team is already locked/i,
    key: 'errors.teamLocked',
  },
  {
    pattern: /team is locked and cannot remove members/i,
    key: 'errors.teamLockedRemove',
  },
  {
    pattern: /team is locked and cannot be left|cannot leave locked team/i,
    key: 'errors.teamLockedLeave',
  },
  {
    pattern: /team has already reached the maximum limit|already full \(maximum 3 members\)|team is full/i,
    key: 'errors.teamFull',
  },
  {
    pattern: /only the team leader can send invitations/i,
    key: 'errors.onlyLeaderInvite',
  },
  {
    pattern: /only the team leader can remove members/i,
    key: 'errors.onlyLeaderRemove',
  },
  {
    pattern: /only the team leader can rename the team/i,
    key: 'errors.onlyLeaderRename',
  },
  {
    pattern: /only current team leader can transfer leadership/i,
    key: 'errors.onlyLeaderTransfer',
  },
  {
    pattern: /leader cannot leave the team/i,
    key: 'errors.leaderCannotLeave',
  },
  {
    pattern: /team leader cannot remove themselves/i,
    key: 'errors.leaderCannotRemoveSelf',
  },
  {
    pattern: /new leader must be an existing team member/i,
    key: 'errors.newLeaderMustBeMember',
  },
  {
    pattern: /already sent a pending invitation to this student/i,
    key: 'errors.alreadyInvited',
  },
  {
    pattern: /only respond to your own invitations/i,
    key: 'errors.onlyOwnInvitations',
  },
  {
    pattern: /invitation is no longer pending/i,
    key: 'errors.invitationNotPending',
  },

  // Matchmaking
  {
    pattern: /matchmaking post is no longer open/i,
    key: 'errors.postClosed',
  },
  {
    pattern: /already have a pending join request for this post/i,
    key: 'errors.alreadyRequested',
  },
  {
    pattern: /you are already a member of this team/i,
    key: 'errors.alreadyMember',
  },
  {
    pattern: /join requests can only be sent to team posts/i,
    key: 'errors.joinOnlyTeamPosts',
  },

  // General Data & Network
  {
    pattern: /the defense must start in the future and end after its start time/i,
    key: 'errors.defenseTimeInvalid',
  },
  {
    pattern: /the defense has not started yet; only draft assessments can be saved/i,
    key: 'errors.defenseNotStarted',
  },
  {
    pattern: /duplicate value or is referenced by other records|duplicate key|already exists/i,
    key: 'errors.conflict',
  },
  {
    pattern: /uploaded file exceeds the maximum allowed size|payload too large/i,
    key: 'errors.payloadTooLarge',
  },
  {
    pattern: /network error|failed to fetch|econnaborted/i,
    key: 'errors.network',
  },
  {
    pattern: /invalid data payload|constraint violation|unprocessable entity/i,
    key: 'errors.unprocessable',
  },
  {
    pattern: /data not found|resource not found|record not found/i,
    key: 'errors.notFound',
  },
];

/**
 * Clean up technical Java exception prefixes
 */
const cleanRawMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return '';
  return msg
    .replace(/^Invalid argument \(400 Bad Request\):\s*/i, '')
    .replace(/^Invalid request \(400 Bad Request\):\s*/i, '')
    .replace(/^Data not found \(404 Not Found\):\s*/i, '')
    .replace(/^API route or resource not found \(404 Not Found\):\s*/i, '')
    .replace(/^Record not found in system:\s*/i, '')
    .replace(/^Access Denied \(403 Forbidden\):\s*/i, '')
    .replace(/^Authentication failed \(401 Unauthorized\):\s*/i, '')
    .replace(/^Invalid data payload \(422 Unprocessable Entity\):\s*/i, '')
    .replace(/^Constraint violation \(422 Unprocessable Entity\):\s*/i, '')
    .replace(/^Missing required parameter \(422\):\s*/i, '')
    .trim();
};

const getTranslationValue = (lang, keyPath) => {
  const dict = dictionaries[lang] || dictionaries['vi'];
  const value = keyPath.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), dict);
  return value;
};

/**
 * Format any API or JavaScript error into a localized bilingual string using translation dictionaries
 * @param {Error|Object|string} error The error caught
 * @param {string} lang 'vi' or 'en'
 * @returns {string} User-friendly message
 */
export function formatApiError(error, lang = 'vi') {
  if (!error) return '';

  const activeLang = lang === 'en' ? 'en' : 'vi';

  let rawMessage = typeof error === 'string' ? error : (error.message || '');
  let status = error.status || (error.response ? error.response.status : null);
  let validationErrors = error.validationErrors || error.response?.data?.validationErrors;

  // Validation errors
  if (validationErrors && Object.keys(validationErrors).length > 0) {
    const errorItems = Object.entries(validationErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(', ');
    const prefix = getTranslationValue(activeLang, 'errors.validationPrefix') || 'Dữ liệu không hợp lệ: {errors}';
    return prefix.replace('{errors}', errorItems);
  }

  // Check known business rules from regex rules
  for (const rule of ERROR_KEY_RULES) {
    if (rule.pattern.test(rawMessage)) {
      const translated = getTranslationValue(activeLang, rule.key);
      if (translated) return translated;
    }
  }

  // Check HTTP Status fallback
  if (status) {
    switch (status) {
      case 400:
        return cleanRawMessage(rawMessage) || getTranslationValue(activeLang, 'errors.badRequest');
      case 401:
        return getTranslationValue(activeLang, 'errors.unauthorized');
      case 403:
        return getTranslationValue(activeLang, 'errors.forbidden');
      case 404:
        return getTranslationValue(activeLang, 'errors.notFound');
      case 409:
        return getTranslationValue(activeLang, 'errors.conflict');
      case 413:
        return getTranslationValue(activeLang, 'errors.payloadTooLarge');
      case 422:
        return cleanRawMessage(rawMessage) || getTranslationValue(activeLang, 'errors.unprocessable');
      case 500:
      case 502:
      case 503:
        return getTranslationValue(activeLang, 'errors.serverError');
      default:
        break;
    }
  }

  const cleaned = cleanRawMessage(rawMessage);
  if (cleaned) {
    return cleaned;
  }

  return getTranslationValue(activeLang, 'errors.default') || 'Đã xảy ra lỗi không xác định.';
}

export default {
  formatApiError,
};

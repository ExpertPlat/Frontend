export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message || 'Request failed.');
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.payload = options.payload ?? null;
    this.code = options.code ?? null;
    this.cause = options.cause;
    this.retryAfter = options.retryAfter ?? null;
  }
}

export function createHttpError(response, payload) {
  const backendMessage = payload && typeof payload.message === 'string' ? payload.message : '';
  return new ApiError(backendMessage || `Request failed with HTTP ${response.status}.`, {
    status: response.status,
    payload,
    code: 'HTTP_ERROR',
    retryAfter: response?.headers?.get?.('Retry-After') || null,
  });
}

export function createClientError(message, code, cause) {
  return new ApiError(message, { status: 0, payload: null, code, cause });
}

export function getErrorMessage(error, fallback = 'تعذر إكمال الطلب. حاول مرة أخرى.') {
  const backendMessage = error?.payload?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;

  if (error?.code === 'TIMEOUT') return 'انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.';
  if (error?.code === 'NETWORK_ERROR') return 'تعذر الاتصال بالخادم. تحقق من الشبكة وحاول مرة أخرى.';
  if (error?.code === 'CONFIG_ERROR') return 'إعداد عنوان الـ API غير مكتمل.';

  const statusFallbacks = {
    400: 'الطلب غير صالح. راجع البيانات وحاول مرة أخرى.',
    401: 'انتهت صلاحية الجلسة أو بيانات الدخول غير صحيحة.',
    403: 'لا تملك صلاحية تنفيذ هذا الطلب أو أن الرابط غير صالح.',
    409: 'يتعارض الطلب مع الحالة الحالية على الخادم. حدّث البيانات ثم حاول مرة أخرى.',
    404: 'تعذر العثور على المورد المطلوب.',
    419: 'انتهت صلاحية الجلسة. أعد المحاولة بعد تسجيل الدخول.',
    422: 'تعذر اعتماد البيانات المرسلة. راجع الحقول وحاول مرة أخرى.',
    429: 'تم إرسال طلبات كثيرة خلال وقت قصير. حاول لاحقًا.',
    500: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.',
  };
  if (statusFallbacks[error?.status]) return statusFallbacks[error.status];

  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
}

export function getFieldErrors(error) {
  const errors = error?.payload?.errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};
  return errors;
}

export function getFirstFieldError(fieldErrors, fieldName) {
  const value = fieldErrors?.[fieldName];
  if (Array.isArray(value)) return value.find((item) => typeof item === 'string' && item.trim()) || '';
  return typeof value === 'string' ? value : '';
}

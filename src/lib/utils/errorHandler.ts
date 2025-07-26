import { AxiosError } from "axios";

interface ErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  details?: string[] | null;
}

// Error code to user-friendly message mapping
const ERROR_MESSAGES: Record<string, string> = {
  // Registration errors
  DUPLICATE_PHONE:
    "Số điện thoại này đã được đăng ký. Vui lòng sử dụng số điện thoại khác.",
  INVALID_PHONE: "Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.",
  WEAK_PASSWORD: "Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.",
  REGISTRATION_FAILED: "Đăng ký thất bại. Vui lòng thử lại sau.",

  // Login errors
  MISSING_CREDENTIALS: "Vui lòng nhập đầy đủ thông tin đăng nhập.",
  ACCOUNT_NOT_FOUND:
    "Tài khoản không tồn tại. Vui lòng kiểm tra lại số điện thoại.",
  INCORRECT_PASSWORD: "Mật khẩu không chính xác. Vui lòng thử lại.",
  ACCOUNT_PENDING_APPROVAL:
    "Tài khoản của bạn đang chờ được giáo viên phê duyệt.",
  DEVICE_MISMATCH:
    "Bạn chỉ có thể đăng nhập từ thiết bị đã đăng ký. Liên hệ giáo viên để được hỗ trợ.",
  DEVICE_IDENTIFICATION_ERROR: "Không thể xác định thiết bị. Vui lòng thử lại.",
  INVALID_ADMIN_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không chính xác.",

  // Validation errors
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
  MISSING_FIELDS: "Vui lòng điền đầy đủ thông tin bắt buộc.",

  // Network errors
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
  TIMEOUT: "Yêu cầu quá thời gian chờ. Vui lòng thử lại.",

  // Server errors
  INTERNAL_ERROR: "Lỗi hệ thống. Vui lòng thử lại sau.",
  SERVICE_UNAVAILABLE: "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
};

// Extract error message from various error response formats
export const extractErrorMessage = (error: unknown): string => {
  if (!error) {
    return "Đã xảy ra lỗi không xác định";
  }

  // Handle Axios errors
  if (error instanceof Error && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ErrorResponse>;

    // Check if there's a response from the server
    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // Priority 1: Check for specific error message in 'error' field
      if (data.error && typeof data.error === "string") {
        // Check for known error patterns
        if (data.error.includes("Số điện thoại này đã được đăng ký")) {
          return ERROR_MESSAGES.DUPLICATE_PHONE;
        }
        if (data.error.includes("Missing required fields")) {
          return ERROR_MESSAGES.MISSING_FIELDS;
        }

        // Return the actual error message if it's user-friendly
        if (
          data.error !== "Internal server error" &&
          data.error !== "INTERNAL_ERROR"
        ) {
          return data.error;
        }
      }

      // Priority 2: Check error code mapping
      if (data.code && ERROR_MESSAGES[data.code]) {
        return ERROR_MESSAGES[data.code];
      }

      // Priority 3: Use message field
      if (data.message && typeof data.message === "string") {
        return data.message;
      }

      // Priority 4: Check details array
      if (
        data.details &&
        Array.isArray(data.details) &&
        data.details.length > 0
      ) {
        return data.details.join(". ");
      }
    }

    // Handle network errors
    if (axiosError.code === "ERR_NETWORK") {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (axiosError.code === "ECONNABORTED") {
      return ERROR_MESSAGES.TIMEOUT;
    }

    // Handle specific HTTP status codes
    if (axiosError.response?.status === 500) {
      return ERROR_MESSAGES.INTERNAL_ERROR;
    }

    if (axiosError.response?.status === 503) {
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    }
  }

  // Handle regular Error objects
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Default error message
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
};

// Helper to get contextual help based on error type
export const getErrorHelp = (errorMessage: string): string | null => {
  if (errorMessage.includes("Số điện thoại này đã được đăng ký")) {
    return "Bạn có thể đăng nhập với số điện thoại này hoặc sử dụng số khác để đăng ký.";
  }

  if (errorMessage.includes("Tài khoản không tồn tại")) {
    return "Vui lòng kiểm tra lại số điện thoại hoặc đăng ký tài khoản mới.";
  }

  if (errorMessage.includes("Mật khẩu không chính xác")) {
    return "Vui lòng kiểm tra lại mật khẩu. Nếu quên mật khẩu, hãy liên hệ giáo viên.";
  }

  if (errorMessage.includes("đang chờ được giáo viên phê duyệt")) {
    return "Vui lòng liên hệ giáo viên để được phê duyệt tài khoản.";
  }

  if (errorMessage.includes("thiết bị đã đăng ký")) {
    return "Mỗi tài khoản chỉ được đăng nhập trên một thiết bị. Liên hệ giáo viên để đổi thiết bị.";
  }

  if (errorMessage.includes("Mật khẩu") && errorMessage.includes("8 ký tự")) {
    return "Mật khẩu cần có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
  }

  if (errorMessage.includes("kết nối")) {
    return "Vui lòng kiểm tra kết nối internet của bạn và thử lại.";
  }

  return null;
};

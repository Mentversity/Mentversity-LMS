class ApiResponse {
  static ok(data = {}, message = 'OK') {
    return { success: true, data, message };
  }
  static fail(message = 'Error') {
    return { success: false, message };
  }
}
module.exports = ApiResponse;

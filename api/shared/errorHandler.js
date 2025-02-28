module.exports = function errorHandler(context, error, defaultMessage = 'An unexpected error occurred') {
    context.log.error('Error:', error);

    context.res = {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
        body: { message: error.message || defaultMessage }
    };
}; 
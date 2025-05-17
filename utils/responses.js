const error = (msg) => {
    return {
        'success': 'false',
        'message': msg,
    }
}

const success = (msg) => {
    return {
        'success': 'true',
        'message': msg,
    }
}

const success_data = (data) => {
    return {
        'success': 'true',
        'data': data
    }
}

module.exports = {
    error,
    success,
    success_data
}
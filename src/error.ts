export const logError = (message: string, errorCode: string) => {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
};

export interface HttpError extends Error {
	statusCode?: number;
	originalError?: Error;
}

export function createError(
	statusCode: number,
	message: string,
	originalError: Error
): HttpError {
	let err: HttpError = new Error(message);
	err.statusCode = statusCode;
	err.originalError = originalError;

	return err;
}
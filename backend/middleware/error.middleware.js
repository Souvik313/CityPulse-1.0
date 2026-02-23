const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log error
  console.error("🔥 ERROR:", {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack
  });

  // Mongoose: Invalid ObjectId
  if (err.name === "CastError") {
    err.message = "Invalid ID format";
    err.statusCode = 400;
  }

  // Mongoose: Duplicate key error
  if (err.code === 11000) {
    err.message = `Duplicate field value: ${Object.keys(err.keyValue).join(", ")}`;
    err.statusCode = 400;
  }

  // Mongoose: Validation error
  if (err.name === "ValidationError") {
    err.message = Object.values(err.errors)
      .map(el => el.message)
      .join(". ");
    err.statusCode = 400;
  }

  // Final response
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message
  });
};

export default errorMiddleware;

/**
 * An error for issues relating to improperly-subclassed abstract base classes.
 */
export class ABCError extends Error {
  constructor(message) {
    super(message);
    this.name = "ABCError";
  }
}


/**
 * An error for a failed call to {@link assert}.
 */
class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}


/**
 * Assert that a condition is true, throwing an error if this is not the case.
 * @param {boolean} condition The condition to assert
 * @param {string | null} message The error message
 * @param {class} errorType The class of error to throw
 */
export function assert(condition, message=null, errorType=AssertionError) {
  if (!condition) {
    throw new errorType(message || "Assertion failed");
  }
}


/**
 * An error for when a line ends.
 */
export class EOFError extends Error {
  constructor(message) {
    super(message);
    this.name = "EOFError";
  }
}


/**
 * An error for errors caused by the user's Scheme code.
 */
export class SchemeError extends Error {
  constructor(message) {
    super(message);
    this.name = "SchemeError";
  }
}

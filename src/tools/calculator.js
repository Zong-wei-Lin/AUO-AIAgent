export const calculateTool = {
  type: "function",
  name: "calculate",
  description: "進行數學計算",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: '算式字串，例如 "10 + 5 * 2"',
      },
    },
    required: ["expression"],
    additionalProperties: false,
  },
  strict: true,
};

function validateExpression(expression) {
  if (typeof expression !== "string") {
    throw new TypeError("expression 必須是字串");
  }

  const trimmed = expression.trim();
  if (trimmed === "") {
    throw new Error("expression 不能為空");
  }

  if (!/^[0-9+\-*/().\s]+$/.test(trimmed)) {
    throw new Error("expression 只能包含數字、空白和 + - * / ( )");
  }

  return trimmed;
}

export async function calculate({ expression }) {
  try {
    const sanitized = validateExpression(expression);
    const result = Function(`"use strict"; return (${sanitized})`)();

    if (typeof result !== "number" || Number.isNaN(result) || !Number.isFinite(result)) {
      return {
        expression: sanitized,
        error: "計算結果無效",
      };
    }

    return {
      expression: sanitized,
      result,
    };
  } catch (error) {
    return {
      expression,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
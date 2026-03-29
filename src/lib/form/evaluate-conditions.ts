import type { FieldCondition } from "@/types";

export function evaluateConditions(
  conditions: FieldCondition[] | undefined,
  formData: Record<string, unknown>,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  const first = conditions[0];
  if (!first) return true;

  let result = evaluateSingle(first, formData);

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    if (!condition) continue;
    const condResult = evaluateSingle(condition, formData);

    if (condition.logic === "AND") {
      result = result && condResult;
    } else {
      result = result || condResult;
    }
  }

  return result;
}

function evaluateSingle(
  condition: FieldCondition,
  formData: Record<string, unknown>,
): boolean {
  const fieldValue = String(formData[condition.fieldKey] ?? "");
  const compareValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return fieldValue.toLowerCase() === compareValue.toLowerCase();
    case "not_equals":
      return fieldValue.toLowerCase() !== compareValue.toLowerCase();
    case "contains":
      return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
    case "greater_than":
      return Number(fieldValue) > Number(compareValue);
    case "less_than":
      return Number(fieldValue) < Number(compareValue);
    case "is_empty":
      return fieldValue === "" || fieldValue === "undefined" || fieldValue === "null";
    case "is_not_empty":
      return fieldValue !== "" && fieldValue !== "undefined" && fieldValue !== "null";
    case "matches":
      try {
        return new RegExp(compareValue, "i").test(fieldValue);
      } catch {
        return false;
      }
    default:
      return true;
  }
}

// Formats a JavaScript Date object to a string in the format: day-month-year
export const formatDate = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return "Invalid Date"; // Return a default string for invalid date objects
  }
  
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  
  const formattedDate = `${day}-${month}-${year}`;
  
  return formattedDate;
};

// Converts a date string to the format: yyyy-mm-dd
export function dateFormatter(dateString) {
  const inputDate = new Date(dateString);
  
  if (isNaN(inputDate)) {
    return "Invalid Date";
  }
  
  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const day = String(inputDate.getDate()).padStart(2, "0");
  
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

// Generates initials from a full name
export function getInitials(fullName) {
  // Check if fullName is defined and not empty
  if (!fullName) {
    return ""; // Return an empty string if fullName is undefined or empty
  }
  
  const names = fullName.split(" ");
  const initials = names.slice(0, 2).map((name) => name[0].toUpperCase());
  
  const initialsStr = initials.join("");
  
  return initialsStr;
}

// Styles for task priority
export const PRIORITYSTYLES = {
  high: "text-red-600",
  medium: "text-yellow-600",
  low: "text-blue-600",
};

// Background styles for task types
export const TASK_TYPE = {
  todo: "bg-blue-600",
  "in progress": "bg-yellow-600",
  completed: "bg-green-600",
};

// Array of background color styles
export const BGS = [
  "bg-blue-600",
  "bg-yellow-600",
  "bg-red-600",
  "bg-green-600",
];

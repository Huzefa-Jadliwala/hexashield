export const getUserIdFromLocalStorage = () => {
  const userString = localStorage.getItem("user"); // Retrieve user data from localStorage
  if (userString) {
    try {
      const user = JSON.parse(userString); // Parse the JSON string
      return user.userId || null; // Return the userId if it exists, otherwise return null
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
      return null;
    }
  }
  console.warn("No user data found in localStorage.");
  return null; // Return null if no user data is found
};

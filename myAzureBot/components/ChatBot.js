try {
  const response = await fetch("http://localhost:3978/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input,
      userId: userId,
      mode: "planner", // or 'guide'
    }),
  });
  // ... 나머지 코드
} catch (error) {
  console.error("Error fetching chat:", error);
}

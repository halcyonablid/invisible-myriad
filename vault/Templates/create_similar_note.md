<%*
try {
  await tp.user.create_similar_note(tp);
} catch (error) {
  console.error("Error in createSimilarNote:", error);
  new Notice("Error: " + error.message);
}
_%>
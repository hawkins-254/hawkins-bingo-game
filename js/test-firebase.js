async function testFirestore() {
  try {
    const docRef = await addDoc(collection(db, "players"), {
      name: "Test Player",
      email: "test@example.com",
      createdAt: Date.now()
    });
    console.log("Document written with ID:", docRef.id);
  } catch (e) {
    console.error("Error adding document:", e);
  }
}

testFirestore();
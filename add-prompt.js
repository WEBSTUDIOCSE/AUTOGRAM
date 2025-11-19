const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
// For UAT environment
const serviceAccount = {
  projectId: "env-uat-cd3c5",
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: serviceAccount.projectId
});

const db = admin.firestore();

async function addPrompt() {
  try {
    // You need to replace 'YOUR_USER_ID' with the actual user ID
    const userId = process.argv[2] || 'YOUR_USER_ID';
    
    if (userId === 'YOUR_USER_ID') {
      console.error('Please provide a user ID as argument: node add-prompt.js YOUR_USER_ID');
      process.exit(1);
    }

    const promptData = {
      userId: userId,
      basePrompt: "Create a hyper-realistic full-body portrait of a woman elegantly leaning against a rustic red brick wall in an outdoor street setting. She is adorned in a bright purple printed saree paired with a sleeveless white blouse. Her accessories include bold statement earrings, multiple bangles, a sleek wristwatch, and a simple ring. Her hair is styled in a smooth low bun with a center parting. Delicate pink flowers bloom above her, some softly blurred in the foreground, adding a dreamy effect. Soft, warm golden sunlight bathes the scene, highlighting the shimmer of the saree fabric. The composition follows a cinematic 9:16 aspect ratio with a shallow depth of field, creating an ethereal, graceful vibe.",
      category: "portrait",
      usageCount: 0,
      lastUsedAt: null,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('prompt_templates').add(promptData);
    console.log('✅ Prompt added successfully!');
    console.log('Document ID:', docRef.id);
    console.log('User ID:', userId);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding prompt:', error);
    process.exit(1);
  }
}

addPrompt();

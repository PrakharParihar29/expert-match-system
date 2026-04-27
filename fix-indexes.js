const mongoose = require("mongoose");

async function fix() {
  await mongoose.connect("mongodb+srv://minorproject77777_db_user:0xgA3VcgUrlb6xd8@cluster0.dh9o56u.mongodb.net/expert-match-system?appName=Cluster0");
  console.log("Connected");
  
  try {
    await mongoose.connection.db.collection("experts").dropIndex("email_1");
    console.log("Dropped email index on experts");
  } catch(e) {
    console.log("Experts index error:", e.message);
  }
  
  try {
    await mongoose.connection.db.collection("candidates").dropIndex("email_1");
    console.log("Dropped email index on candidates");
  } catch(e) {
    console.log("Candidates index error:", e.message);
  }
  
  process.exit(0);
}
fix();

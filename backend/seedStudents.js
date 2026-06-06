require('dotenv').config();
const { db } = require('./config/firebase');

const students = [
  { matricNo: '19/097344140', name: 'Paul Cherish Chisom', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344007', name: 'Agbai Chinenye Blossom', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344012', name: 'Akpadaha John Jonah', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344013', name: 'Akpan Inyeneobong Sunday', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344014', name: 'Ande Christabel', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344019', name: 'Aqua Paul Inang', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344022', name: 'Awa Emmanuel Agwu', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344025', name: 'Ayuk Joseph Obanghe', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344027', name: 'Bassey Ekpereonne Samuel', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344036', name: 'Chukwuma Ikechukwu Christian', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344053', name: 'Eta Kelvin-Carter Efoli', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344054', name: 'Etim Nya Bassey', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344060', name: 'Eze Christopher Onyebuchi', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344061', name: 'Eze Prince Chukwuemeka', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344066', name: 'Idika Ikechi Ukaha', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344074', name: 'John-Ejeh Favour Ojodale', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344076', name: 'Maurice David Ekefre', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344077', name: 'Mbia Cajetan Bankong', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344080', name: 'Obeten Obeten Monday', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344084', name: 'Offem Kanu Etan', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344087', name: 'Ogar Sunday Denis', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344088', name: 'Ogbonna Stanley Chidera', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344089', name: 'Ogosi Ebiye Daniel', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344092', name: 'Okeke Chinecherm Mirabel', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344094', name: 'Okoh Michael Abah', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344095', name: 'Okon Wisdom Dominic', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344096', name: 'Okpe Faith Onyinyechi', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344102', name: 'Osang Miracle Obi', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344108', name: 'Oyebode Peter Oluwaseye', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344109', name: 'Oyinlola Ayo-Bami David', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344112', name: 'Raph-Obun Noah Memfem', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344113', name: 'Salihu Salihu Bashir', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344116', name: 'Solomon Joseph Joseph', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344117', name: 'Sunday Victor Dominic', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344120', name: 'Ugbem Peter', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344122', name: 'Ugwuagbor Emmanuel Chukwuemeka', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344129', name: 'Utang David Lipehumim', department: 'Electronic & Computer Tehnology' },
  { matricNo: '20/097344137', name: 'Obiwary Silas Ekwo', department: 'Electronic & Computer Tehnology' },
];

async function seed() {
  console.log(`Seeding ${students.length} students...`);
  for (const student of students) {
    const docId = student.matricNo.replace(/\//g, '-'); // 19/097344140 → 19-097344140
    await db.collection('students').doc(docId).set(student);
    console.log(`✅ ${student.matricNo} — ${student.name}`);
  }
  console.log('\nDone! All students seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
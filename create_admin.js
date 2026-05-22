const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'annc19324'; // Using this as email to allow login
  const password = 'Zeanokai@1';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Admin user created successfully');
  } else {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', password: hashedPassword }
    });
    console.log('Admin user updated successfully');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

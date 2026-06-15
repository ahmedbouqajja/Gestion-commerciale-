import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'prof@demo.ma' },
    update: {},
    create: {
      email: 'prof@demo.ma',
      password,
      name: 'Professeur Démo',
      school: 'Lycée Mohammed V',
      subject: 'Mathématiques',
      level: 'Collège',
      plan: 'PRO',
      language: 'fr',
    },
  });

  await prisma.document.createMany({
    data: [
      {
        userId: user.id,
        type: 'JDADA',
        title: 'Jdada — Les fractions (Mathématiques)',
        subject: 'Mathématiques',
        level: '6ème année primaire',
        language: 'fr',
        content:
          '## Objectifs pédagogiques\n- Comprendre la notion de fraction\n\n## Compétences visées\n- Manipuler les fractions simples\n\n## Déroulement\n- Mise en situation (10 min)\n- Construction (25 min)\n- Application (15 min)\n\n## Évaluation\n- Exercices d\'application',
        meta: { lesson: 'Les fractions', duration: '50 min' },
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Données de démonstration créées. Compte : prof@demo.ma / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

const { Router } = require('express');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const [activeReqs, pipeline, interviews, offers, allReqs] = await Promise.all([
      req.prisma.requisition.count({ where: { status: 'Open' } }),
      req.prisma.application.count({
        where: { pipelineStage: { notIn: ['Hired', 'Rejected', 'Withdrawn'] } },
      }),
      req.prisma.application.count({
        where: { pipelineStage: { in: ['LCS Interview', 'Client Interview'] } },
      }),
      req.prisma.application.count({ where: { pipelineStage: 'Offer' } }),
      req.prisma.requisition.findMany({
        where: { status: 'Open' },
        select: { id: true, createdAt: true },
      }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const agedReqs = allReqs.filter(r => r.createdAt < thirtyDaysAgo).length;

    // Recent applications
    const recentApplications = await req.prisma.application.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: { select: { name: true } },
        requisition: { select: { position: true, customer: true } },
      },
    });

    // Aged requisitions list
    const agedReqsList = await req.prisma.requisition.findMany({
      where: {
        status: 'Open',
        createdAt: { lt: thirtyDaysAgo },
      },
      include: { applications: { select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      kpis: {
        activeReqs,
        pipeline,
        interviews,
        offers,
        agedReqs,
      },
      recentApplications,
      agedReqsList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

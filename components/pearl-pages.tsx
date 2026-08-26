import { ArrowLink, PageFrame, PageHero, SectionHeading } from './site-shell'
import { asset } from '@/lib/pearl-assets'
import { ContactForm } from './contact-form'
import { Reveal } from './reveal'
import { PartnerLogoGrid, PartnerLogoRow, type Logo } from './partner-logos'

const aboutPartners: Logo[] = [
  { file: 'Partners (3).png', alt: 'Second Harvest' },
  { file: 'Partners (2).png', alt: 'Acadia University' },
  { file: 'Partners (7).png', alt: 'Rural Futures Research Collaborative' },
  { file: 'Partners.png', alt: 'St. Francis Xavier University' },
  { file: 'Partners (4).png', alt: "Farmers' Market Antigonish" },
  { file: 'Partners (6).png', alt: 'Mount Saint Vincent University' },
  { file: 'Partners (5).png', alt: 'FarmWorks Investment Co-operative' },
  { file: 'Partners (8).png', alt: 'Nova Scotia Federation of Agriculture' },
]

export function AboutPage() {
  return (
    <PageFrame>
      <main>
        <PageHero
          kicker="About PEARL"
          title="Research with people, not just about people."
          intro="PEARL is an interdisciplinary research lab dedicated to advancing health equity through collaborative, community-engaged, and policy-relevant research."
        />

        <section className="content-section">
          <Reveal className="site-container two-column">
            <div>
              <p className="eyebrow">Our mission</p>
              <h2>To generate actionable, equity-centred research that improves population health and strengthens health systems.</h2>
            </div>
            <div className="prose">
              <p>We bring together researchers, students, healthcare providers, policymakers, and community partners to address complex health and social challenges through innovative, evidence-informed approaches.</p>
              <p>Our work spans health systems improvement, food security, social determinants of health, patient and caregiver experiences, and the structural factors that shape health outcomes and inequities.</p>
            </div>
          </Reveal>
        </section>

        <section className="vision-section">
          <Reveal className="site-container vision-inner">
            <p className="eyebrow">Our vision</p>
            <h2>A future where all individuals and communities have equitable opportunities to achieve health and wellbeing.</h2>
            <p>Where health systems and policies are designed through inclusive, evidence-based, and justice-oriented approaches that address the root causes of inequity.</p>
          </Reveal>
        </section>

        <section className="values-section">
          <div className="site-container">
            <SectionHeading kicker="What guides us" title="PEARL values" />
            <div className="values-grid">
              {[
                ['P', 'Partnership', 'Building meaningful collaborations with communities, patients, researchers, and policymakers.'],
                ['E', 'Equity', 'Centering health equity and social justice in all aspects of our work.'],
                ['A', 'Advocacy', 'Translating evidence into action to advance policy and systems change.'],
                ['R', 'Research excellence', 'Conducting rigorous, ethical, and innovative interdisciplinary research.'],
                ['L', 'Leadership', 'Fostering future leaders and driving transformative change in population health.'],
              ].map(([letter, title, text], i) => (
                <Reveal delay={i * 70} key={letter}>
                  <article>
                    <span>{letter}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="partners-section">
          <div className="site-container">
            <Reveal className="partners-intro">
              <p className="eyebrow">In good company</p>
              <h2>Collaboration is at the heart of our work.</h2>
              <p>We partner with community organizations, healthcare providers, academic institutions, policymakers, and industry partners to conduct research that addresses real-world challenges and is translated into meaningful action.</p>
            </Reveal>
            <Reveal delay={100}>
              <PartnerLogoGrid logos={aboutPartners} />
            </Reveal>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

const research = [
  ['Health systems & services', 'How healthcare services are organized, delivered, and experienced to improve access, quality, efficiency, and equity.', 'Health Systems & Services.jpeg'],
  ['Health equity & access to care', 'Identifying and addressing the structural and social barriers that contribute to inequities in health outcomes and healthcare access.', 'Health Equity & Access to Care.jpeg'],
  ['Transforming food systems', 'Exploring pathways toward more sustainable, equitable, and resilient food systems that promote food security and community wellbeing.', 'Transforming Food Systems.jpeg'],
  ['Patient & community engagement', 'Partnering with patients, caregivers, and communities to ensure research reflects lived experiences, local priorities, and meaningful participation.', 'Patient & Community Engagement.png'],
  ['Health policy, implementation & advocacy', 'Generating evidence that informs policy, supports implementation, and drives meaningful change across health and social systems.', 'Health Policy, Implementation & Advocacy.jpeg'],
]

export function ResearchPage() {
  return (
    <PageFrame>
      <main>
        <PageHero
          kicker="Research"
          title="Research that connects evidence to action."
          intro="Our work is grounded in the belief that improving health requires action across the social, economic, environmental, and policy systems that influence people's lives."
        />
        <section className="research-list">
          <div className="site-container">
            {research.map(([title, text, image], i) => (
              <Reveal className="research-row" delay={i * 60} key={title}>
                <div className="research-copy">
                  <span className="stream-number">0{i + 1}</span>
                  <h2>{title}</h2>
                  <p>{text}</p>
                  <ArrowLink href="/contact">Discuss this area</ArrowLink>
                </div>
                <img src={asset(image)} alt={title} />
              </Reveal>
            ))}
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

const tfsPartners: Logo[] = [
  { file: 'Partners (6).png', alt: 'Mount Saint Vincent University' },
  { file: 'dalhouse.png', alt: 'Dalhousie University' },
  { file: 'Partners (2).png', alt: 'Acadia University' },
  { file: 'Partners (3).png', alt: 'Second Harvest' },
  { file: 'Partners (5).png', alt: 'FarmWorks Investment Co-operative' },
]

const iftPartners: Logo[] = [
  { file: 'EHS.png', alt: 'Emergency Health Services' },
  { file: 'EMC.png', alt: 'EMC' },
  { file: 'NV Health.png', alt: 'Nova Scotia Health' },
  { file: 'C3-vertical.png', alt: 'Care Coordination Centre' },
]

const tfsIntro = [
  'Food waste and food insecurity exist alongside one another across Canada. While substantial amounts of food are lost or wasted throughout the food system, many communities continue to face barriers to accessing nutritious and affordable food. In rural Nova Scotia, these challenges are shaped by the realities of agricultural production, geography, transportation, infrastructure, seasonal availability, labour, markets, and connections between producers and community food organizations.',
  'Surplus to Solutions examines how avoidable food waste is generated and managed at the farm level, and how food that could still be consumed can be redirected to communities rather than becoming waste. The project focuses on the pathways through which farm-level surplus moves, or does not move, toward food rescue organizations and community food programs, and on the conditions that make redistribution possible.',
  'The project brings together researchers, farmers, food rescue organizations, food-system partners, and community stakeholders to examine avoidable food waste as a systems issue rather than simply as an issue of individual behaviour. Decisions about surplus are influenced by interconnected economic, logistical, social, behavioural, institutional, and policy factors. Understanding these factors is essential to developing approaches that are practical for farmers and sustainable for the organizations receiving and redistributing food.',
  'The research is led through an interdisciplinary collaboration at PEARL Lab, St. Francis Xavier University, bringing together expertise in public health, food systems, agriculture, behavioural science, rural sociology, and community-based research. The project also involves collaborators from Mount Saint Vincent University, Dalhousie University, and Acadia University, alongside community and food-system partners including Second Harvest and FarmWorks Investment Co-operative. These partnerships connect academic expertise with the experiences and networks of farmers, food rescue organizations, and community food organizations.',
]

const tfsSections = [
  {
    heading: 'Understanding avoidable food waste at the farm level',
    image: 'Approach.jpeg',
    body: [
      "A central focus of the research is understanding what happens to food that is produced but does not enter conventional markets or reach consumers. Food may become surplus for many different reasons — market conditions, changing demand, production volumes, seasonal timing, quality or appearance standards, labour availability, storage capacity, transportation, and limited connections to redistribution organizations can all influence what happens to food after it has been produced.",
      'The project therefore looks beyond how much food is wasted to understand the pathways, decisions, and conditions that shape what happens to avoidable food waste.',
      "We are particularly interested in understanding the experiences of farmers and the practical realities they face when considering whether and how surplus food can be redistributed. For redistribution to be a realistic option, farmers need pathways that fit within their existing operations and account for timing, labour, storage, transportation, food safety, costs, and connections with organizations that can receive the food.",
    ],
  },
  {
    heading: 'Food redistribution as a systems issue',
    body: [
      'Avoidable food waste does not occur within a single part of the food system. The ability to redistribute surplus depends on relationships between producers, food rescue organizations, community food programs, transportation providers, and other actors.',
      'Our research therefore examines the broader system surrounding farm-level food redistribution, including the behavioural, logistical, economic, social, institutional, and policy factors that can enable or constrain action. This includes understanding where existing redistribution pathways work well, where they break down, and what gaps in infrastructure, resources, coordination, or partnerships may prevent food from reaching communities.',
    ],
  },
  {
    heading: 'Collaborative and community-based research',
    image: 'Farm Level.jpeg',
    body: [
      'The project uses a community-based participatory research approach, bringing people working within the food system into the research process. Farmers, food rescue organizations, food-system partners, and other stakeholders will contribute to understanding the current system, identifying priorities, and shaping potential solutions.',
      'This collaborative approach allows research findings to be considered alongside practical knowledge from people who work directly within agricultural production, food rescue, and community food systems.',
    ],
  },
  {
    heading: 'Building a more connected rural food system',
    body: [
      'Surplus to Solutions is about understanding how good food can remain within the food system for longer and reach people who can use it.',
      'By connecting farmers, food rescue organizations, researchers, and community partners, the project aims to identify ways to reduce avoidable food waste while strengthening local food redistribution pathways. The goal is a more connected rural food system in which farmers have realistic options for managing surplus, food rescue organizations can access food through stronger and more reliable pathways, and communities can benefit from food that might otherwise be lost.',
    ],
  },
]

const iftIntro = [
  'Non-urgent interfacility patient transfers (IFTs) are an essential but often overlooked component of healthcare delivery. Patients may need to move between healthcare facilities to access specialized consultations, diagnostic procedures, rehabilitation, ongoing treatment, or care closer to home. In Nova Scotia, where specialized services are often concentrated in regional centres and many communities are geographically dispersed, effective interfacility transfer systems are critical to ensuring that patients can access the care they need, when they need it.',
  'Yet moving a patient between facilities is much more than arranging transportation. Every transfer involves clinical decision-making, coordination between sending and receiving teams, transportation and staffing resources, communication across healthcare teams, and decisions about timing and prioritization. These processes operate across organizational and geographic boundaries, making non-urgent IFTs both operationally complex and important to health equity. As our research has demonstrated, an interfacility transfer can simultaneously be a clinical handoff, a logistical process, and an equity decision.',
]

const iftSections = [
  {
    heading: "PEARL's research program",
    body: [
      'The Population Health, Equity, and Advocacy Research Lab (PEARL Lab) at St. Francis Xavier University examines how non-urgent interfacility transfer systems function across Nova Scotia and how they can better support timely, efficient, safe, and equitable access to healthcare. The work is conducted in collaboration with Emergency Health Services (EHS), Emergency Medical Care Inc. (EMC), Nova Scotia Health, the Care Coordination Centre, and other health-system and research partners.',
    ],
    logos: iftPartners,
  },
  {
    heading: 'A systems-level approach',
    image: 'img_1979.jpg.jpeg',
    body: [
      'The program takes a systems-level approach to understanding interfacility transfers. Rather than examining transfer performance through a single measure or perspective, we consider how policies, governance structures, operational processes, technologies, healthcare capacity, geography, and patient and provider experiences interact to shape the transfer pathway. Our overarching question is: what works, for whom, under what circumstances, and through which mechanisms do non-urgent interfacility patient transfer systems support timely, efficient, and equitable access to healthcare?',
      'Our work to date has included examining policies and practices governing non-urgent IFTs across federal, provincial, and organizational levels, with particular attention to how equity is reflected in transfer systems. We have explored the relationship between policy intent and day-to-day practice, including the effects of capacity constraints, communication and information gaps, technology-related workflow challenges, and coordination across organizations.',
      'The research is also informed by evidence from Canada and internationally. Through realist-informed evidence synthesis and jurisdictional research, we examine how different transfer systems are organized, what approaches appear to support effective coordination, and how contextual factors influence outcomes. This includes consideration of patient and family involvement in transfer decision-making and care transitions, recognizing that the experience of an interfacility transfer extends beyond the healthcare organizations and transportation services involved.',
    ],
  },
  {
    heading: 'Health equity as a central theme',
    body: [
      'A central theme across the program is health equity. Traditional measures of transfer performance can provide useful information about overall system efficiency while obscuring differences between populations and communities. A province-wide average transfer time, for example, may not reveal whether rural communities experience longer waits, whether patients with complex mobility needs face different barriers, or whether certain groups experience higher cancellation or re-dispatch rates. Our research therefore considers how geography, rurality, patient and care needs, and other population characteristics can shape access to and experiences of the transfer system.',
      'Building on this foundation, the research program is moving toward a more comprehensive evaluation of transfer-system performance. Quantitative analyses of operational and administrative data will examine patterns in transfer utilization, timeliness, efficiency, completion, cancellations, resource use, changes over time, and differences across geographic and population groups. These analyses will complement the qualitative and policy research by providing an empirical picture of how the system performs across Nova Scotia.',
      'This work will also inform the development of an equity-informed key performance indicator framework for non-urgent IFTs. Rather than treating equity as an additional consideration after performance has been measured, the framework will explore how equity can be incorporated directly into routine monitoring and evaluation. Indicators will be considered not only for their relevance to efficiency and quality, but also for their ability to identify differences in transfer experiences and outcomes that may otherwise be hidden by aggregate reporting.',
    ],
  },
  {
    heading: 'The next stage',
    body: [
      'The next stage of the program will also examine eBooking and structured prioritization approaches, including the development and evaluation of a prioritization matrix for non-urgent transfers. This work will build on what we have learned about policy, equity, system functioning, and operational realities to explore how transfer requests can be prioritized more consistently and transparently while accounting for patient needs, timing, system capacity, and equity considerations.',
      'Together, these strands of research create a continuous pathway from understanding the current transfer system to identifying opportunities for improvement and evaluating whether those improvements make a meaningful difference. Evidence from policy analysis, realist research, stakeholder and patient perspectives, jurisdictional comparisons, quantitative system data, and emerging approaches to transfer coordination will be considered together rather than in isolation.',
      'Ultimately, the goal of this research is not simply to move patients faster. It is to help build a transfer system in which patients can access the appropriate care safely, efficiently, and equitably, regardless of where they live or the circumstances that shape their healthcare journey. By connecting health-system research with policy, implementation, measurement, and equity, this program aims to generate practical evidence that can strengthen non-urgent interfacility transfers in Nova Scotia and contribute to broader efforts to improve integrated healthcare delivery.',
    ],
  },
]

export function ProjectsPage() {
  return (
    <PageFrame>
      <main>
        <PageHero
          kicker="Projects"
          title="Current work, built for real-world change."
          intro="Explore the projects where PEARL researchers and partners are working together to make health systems and communities more equitable."
        />

        <section className="project-feature-section">
          <Reveal className="site-container project-feature-header">
            <span className="project-index">01</span>
            <p className="eyebrow">Transforming food systems</p>
            <h2>Surplus to Solutions</h2>
            <p className="project-subtitle">Enhancing farm-level food redistribution of avoidable edible food waste in rural Nova Scotia</p>
          </Reveal>

          <Reveal className="site-container project-banner-wrap" delay={80}>
            <img className="project-banner" src={asset('Transforming Food Systems.jpeg')} alt="Fresh produce growing in a field in rural Nova Scotia" />
          </Reveal>

          <Reveal className="site-container project-feature-intro prose" delay={120}>
            {tfsIntro.map((p) => <p key={p}>{p}</p>)}
          </Reveal>

          <Reveal className="site-container" delay={160}>
            <PartnerLogoRow logos={tfsPartners} />
          </Reveal>

          <div className="site-container">
            {tfsSections.map((s, i) => (
              <Reveal className={s.image ? 'research-row' : 'research-row research-row-solo'} delay={i * 60} key={s.heading}>
                <div className="research-copy">
                  <h3>{s.heading}</h3>
                  {s.body.map((p) => <p key={p}>{p}</p>)}
                </div>
                {s.image && <img src={asset(s.image)} alt={s.heading} />}
              </Reveal>
            ))}
            <Reveal className="project-feature-cta">
              <ArrowLink href="/contact">Discuss this project</ArrowLink>
            </Reveal>
          </div>
        </section>

        <div className="project-divider" aria-hidden="true" />

        <section className="project-feature-section">
          <Reveal className="site-container project-feature-header">
            <span className="project-index">02</span>
            <p className="eyebrow">Health systems & services</p>
            <h2>Interfacility Patient Transfers</h2>
            <p className="project-subtitle">Advancing equitable and integrated non-urgent interfacility patient transfers in Nova Scotia</p>
          </Reveal>

          <Reveal className="site-container project-feature-intro prose" delay={80}>
            {iftIntro.map((p) => <p key={p}>{p}</p>)}
          </Reveal>

          <div className="site-container">
            {iftSections.map((s, i) => (
              <div key={s.heading}>
                <Reveal className={s.image ? 'research-row' : 'research-row research-row-solo'} delay={i * 60}>
                  <div className="research-copy">
                    <h3>{s.heading}</h3>
                    {s.body.map((p) => <p key={p}>{p}</p>)}
                  </div>
                  {s.image && <img src={asset(s.image)} alt={s.heading} />}
                </Reveal>
                {s.logos && (
                  <Reveal delay={i * 60 + 40}>
                    <PartnerLogoRow logos={s.logos} />
                  </Reveal>
                )}
              </div>
            ))}
            <Reveal className="project-feature-cta">
              <ArrowLink href="/contact">Discuss this project</ArrowLink>
            </Reveal>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

type TeamMember = { name: string; role: string; image: string; bio: string[] }

const leadership: TeamMember[] = [
  {
    name: 'Dr. Mahasti Khakpour',
    role: 'Supervisor & Director',
    image: 'Dr. Mahasti Khakpour.png',
    bio: [
      'Dr. Mahasti Khakpour is the Director of the Population Health Equity Advocacy Research Lab (PEARL) and an Assistant Professor at St. Francis Xavier University. With over eight years of research experience, she is an interdisciplinary health researcher specializing in public health, health equity, food systems, and health economics.',
      'She earned her Ph.D. from the University of Saskatchewan, where her research examined food security among refugees, laying the foundation for her ongoing work with vulnerable populations, including immigrants and refugees. Her research has spanned Canada, Pakistan, Iran, Switzerland, and Australia, focusing on improving health outcomes through innovative, community-engaged approaches.',
      'Through PEARL, Dr. Khakpour leads collaborative research that advances equitable, sustainable, and evidence-informed solutions to complex public health challenges.',
    ],
  },
  {
    name: 'Safa Zohara',
    role: 'Lab Manager',
    image: 'Safa Zohara.jpeg',
    bio: [
      'Safa supports research focused on health systems, health equity, and food systems. Her work centers on improving access to care, addressing the social determinants of health, and advancing equitable health outcomes for underserved populations.',
      'She has coordinated interdisciplinary research projects, conducted health policy and systems analyses, and supported grant development that has secured significant research funding.',
      'Safa is passionate about translating evidence into practical solutions that strengthen health systems and improve community well-being.',
    ],
  },
]

const tfsTeam: TeamMember[] = [
  {
    name: 'Evan Wilson',
    role: 'Masters Thesis Student',
    image: 'Evan.png',
    bio: [
      'Evan supports research focused on sustainable agriculture, food security, and food sovereignty. His work explores how food systems can be transformed to promote environmental sustainability, community resilience, and equitable access to healthy food.',
      'He is a Master of Environmental Sciences student at St. Francis Xavier University, where his research builds on his previous work in Human Nutrition. His honours research examined the development of a healthy Maritime dietary pattern using foods sourced from Atlantic Canada.',
      'Alongside his academic work, Evan is a farmer, founder of the StFX Community Agriculture Program, and Co-President of the Second Harvest National Youth Council, advocating for more sustainable and equitable food systems across Canada.',
    ],
  },
  {
    name: 'Sophie Purcell',
    role: 'Research Assistant',
    image: 'Sophie.jpeg',
    bio: [
      'Sophie is a fourth-year student at St. Francis Xavier University pursuing a Bachelor of Science in Human Nutrition with an Advanced Major in Food Entrepreneurship. Her academic interests include food product development, food systems, and sustainable living.',
      'As a research assistant, Sophie contributes to a project on avoidable food waste at the primary production level in Nova Scotia. She is conducting a grey literature review to identify policies, best practices, and knowledge gaps related to food loss and food rescue, informing future data collection and recommendations for more sustainable and equitable food systems.',
      'Outside this project, Sophie is active in the StFX community and has contributed to research on barriers to venture capital for diverse women-founded businesses.',
    ],
  },
  {
    name: 'Najibah Kazi',
    role: 'Research Assistant',
    image: 'Najibah.png',
    bio: [
      'Najibah is a third-year BaSC student in Health. She started working as a research assistant for the PEARL Lab during the summer of 2025. Her research focuses on the impact of food policy and governance on health.',
      "Najibah's hometown is Antigonish, where she enjoys volunteering around the town.",
      'In the future, she hopes to continue exploring research around barriers to mental health and wellbeing.',
    ],
  },
  {
    name: 'Paige Edgar',
    role: 'Research Assistant',
    image: 'Paige.png',
    bio: [
      'Paige is a third-year student in the BASc Health program at St. Francis Xavier University and is working as a research assistant in the PEARL Lab.',
      'She is contributing to the Transforming Food Systems project, with a focus on the facilitators and barriers that influence the use of digital tools to support the redistribution of food waste at the farm level.',
      'Her research interests include the broader social determinants of health and their impact on individual and population health.',
    ],
  },
]

const iftTeam: TeamMember[] = [
  {
    name: 'Evelyn Christopher',
    role: 'Research Assistant',
    image: 'Evelyn.png',
    bio: [
      'Evelyn recently graduated from Western University with a Master of Public Health. As a Research Assistant with the PEARL Lab, she supports the development of knowledge dissemination products and contributes to research aimed at advancing equitable, evidence-informed healthcare.',
      'Evelyn is passionate about public health, health equity, and creating environments where people have the opportunity to achieve their best possible health. She is particularly interested in health promotion and translating research into accessible resources that can inform policy and practice.',
      'Outside of research, Evelyn enjoys hiking, baking, painting, and playing basketball.',
    ],
  },
  {
    name: 'Erin Cunningham',
    role: 'Research Assistant',
    image: 'Erin.jpeg',
    bio: [
      'Erin graduated from St. Francis Xavier University with a Bachelor of Arts and Science in Health. She is a Research Assistant with the Population Health & Equity Advocacy Research Lab (PEARL).',
      'She supports projects focused on health equity and informing systems through policy reviews, evidence synthesis, knowledge translation, and program evaluation.',
      "Erin's interests include public health, health equity, program evaluation, and knowledge translation. She enjoys applying evidence to support practical solutions that strengthen communities and improve health outcomes.",
    ],
  },
]

const pastTeam: TeamMember[] = [
  {
    name: 'Elmirah Ahmad',
    role: 'Research Assistant',
    image: 'Elmirah Ahmad  Research Assistant.jpeg',
    bio: [
      'Elmirah is a Master of Public Health student at Western University completing her practicum with the Population Health Equity Advocacy and Research (PEARL) Lab.',
      'She is currently involved in the non-urgent interfacility transfers in Nova Scotia project, where she supports qualitative research and policy analysis to better understand barriers within the patient transfer system.',
      'She is interested in health systems, health equity, and using research to inform practical solutions that improve access to care.',
    ],
  },
  {
    name: 'Prachi Ajay Dabholkar',
    role: 'Research Assistant',
    image: 'Prachi Ajay Dabholkar  Research Assistant.jpeg',
    bio: [
      'Prachi is a Research Assistant at the Population Health Equity Advocacy and Research (PEARL) Lab.',
      'She is currently working on the Non-Urgent Interfacility Transfers in Nova Scotia project, where she contributes to equity-focused policy analysis, qualitative research, and geospatial analysis to better understand interfacility transfer patterns, access, and service delivery across the province.',
      'Her research interests include health systems, health equity, and improving access to care for underserved and equity-deserving populations.',
    ],
  },
]

function TeamCard({ member, delay = 0, reverse = false }: { member: TeamMember; delay?: number; reverse?: boolean }) {
  return (
    <Reveal className={reverse ? 'team-row team-row-reverse' : 'team-row'} delay={delay}>
      <div className="team-photo-frame">
        <img src={asset(member.image)} alt={`${member.name}, ${member.role}`} />
      </div>
      <div className="team-card-content">
        <p className="role-tag">{member.role}</p>
        <h2>{member.name}</h2>
        {member.bio.map((p) => <p key={p}>{p}</p>)}
      </div>
    </Reveal>
  )
}

function TeamGroup({ title, members, past = false }: { title: string; members: TeamMember[]; past?: boolean }) {
  return (
    <section className={`team-stream-group${past ? ' team-past-group' : ''}`}>
      <Reveal className="team-stream-heading">
        <span className="team-stream-rule" aria-hidden="true" />
        <div>
          <p className="eyebrow">{past ? 'Previous PEARL contributors' : 'Current research stream'}</p>
          <h2>{title}</h2>
        </div>
      </Reveal>
      {members.map((member, i) => <TeamCard member={member} delay={i * 60} reverse={i % 2 === 1} key={member.name} />)}
    </section>
  )
}

export function TeamPage() {
  return (
    <PageFrame>
      <main>
        <PageHero
          kicker="The people behind the work"
          title="Meet the PEARL team."
          intro="We are researchers, students, practitioners, and community partners working across disciplines and lived experiences."
        />

        <section className="team-intro">
          <Reveal className="site-container team-intro-grid">
            <div>
              <p className="eyebrow">A collaborative lab</p>
              <h2>Different disciplines. One shared commitment to health equity.</h2>
            </div>
            <p className="prose">PEARL brings together researchers and emerging scholars whose work connects public health, health systems, food systems, policy, and community experience. Our team works across research streams to turn evidence into meaningful change.</p>
          </Reveal>
        </section>

        <section className="team-section">
          <div className="site-container">
            <Reveal className="team-group-heading">
              <p className="eyebrow">Leadership & coordination</p>
              <h2>Guiding the work</h2>
            </Reveal>
            {leadership.map((member, i) => <TeamCard member={member} delay={i * 80} reverse={i % 2 === 1} key={member.name} />)}

            <Reveal className="team-group-heading team-group-heading-spaced">
              <p className="eyebrow">Research team</p>
              <h2>Working across PEARL research streams</h2>
            </Reveal>
            <TeamGroup title="Transforming Food Systems" members={tfsTeam} />
            <TeamGroup title="Inter-Facility Transfer System" members={iftTeam} />
            <TeamGroup title="Past Contributors" members={pastTeam} past />
          </div>
        </section>

        <section className="team-cta">
          <Reveal className="site-container team-cta-inner">
            <div>
              <p className="eyebrow">Work with us</p>
              <h2>Have a question about our research or a potential collaboration?</h2>
            </div>
            <ArrowLink href="/contact">Start a conversation</ArrowLink>
          </Reveal>
        </section>
      </main>
    </PageFrame>
  )
}

export function ContactPage() {
  return (
    <PageFrame>
      <main>
        <PageHero
          kicker="Get in touch"
          title="Let's build healthier communities together."
          intro="Whether you are interested in collaborating on research, exploring partnership opportunities, or joining the PEARL team, we would be happy to connect."
        />
        <section className="contact-section">
          <div className="site-container contact-grid">
            <Reveal>
              <SectionHeading title="Start a conversation" body="Tell us a little about what you are working on or how we might collaborate." />
              <div className="contact-details">
                <p><strong>PEARL Research Lab</strong><br />St. Francis Xavier University<br />Antigonish, Nova Scotia</p>
                <p><strong>Hours</strong><br />Monday – Friday, 9am – 5pm</p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

const PASS = bcrypt.hashSync('demo1234', 10);

// ── Demo influencers ──────────────────────────────────────────────────────────
const INFLUENCERS = [
  {
    email: 'sophie.laurent@demo.brandly',
    name:  'Sophie Laurent',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Parisian fashion lover and beauty enthusiast. I create authentic content my audience trusts — from luxury skincare to independent designers.',
    category: 'Fashion & Beauty', country: 'France', city: 'Paris',
    followers: 2100000, price_min: 800, price_max: 3000,
    instagram_url: 'https://instagram.com/sophielaurent',
    contact_info: 'sophie@demo.brandly',
  },
  {
    email: 'marcus.webb@demo.brandly',
    name:  'Marcus Webb',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Tech reviewer and software engineer by day. I break down complex gadgets, SaaS tools, and developer gear into honest, practical reviews.',
    category: 'Technology', country: 'United States', city: 'San Francisco',
    followers: 890000, price_min: 500, price_max: 2000,
    youtube_url: 'https://youtube.com/@marcuswebb',
    contact_info: 'marcus@demo.brandly',
  },
  {
    email: 'alina.park@demo.brandly',
    name:  'Alina Park',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    bio: 'Certified trainer and wellness coach. My TikTok follows real progress — no filters on the struggle or the results. Partnered with Nike and Gymshark.',
    category: 'Health & Fitness', country: 'South Korea', city: 'Seoul',
    followers: 3400000, price_min: 1200, price_max: 4500,
    tiktok_url: 'https://tiktok.com/@alinapark',
    contact_info: 'alina@demo.brandly',
  },
  {
    email: 'diego.fuentes@demo.brandly',
    name:  'Diego Fuentes',
    avatar: 'https://randomuser.me/api/portraits/men/58.jpg',
    bio: 'Mexico City chef turned content creator. I make street food and fine dining equally accessible. Every recipe has a story.',
    category: 'Food & Cooking', country: 'Mexico', city: 'Mexico City',
    followers: 540000, price_min: 300, price_max: 1200,
    instagram_url: 'https://instagram.com/diegofuentes',
    contact_info: 'diego@demo.brandly',
  },
  {
    email: 'yuki.tanaka@demo.brandly',
    name:  'Yuki Tanaka',
    avatar: 'https://randomuser.me/api/portraits/men/14.jpg',
    bio: 'Competitive gamer and full-time streamer. I cover RPGs, indie games, and hardware reviews with an audience that actually buys what I recommend.',
    category: 'Gaming', country: 'Japan', city: 'Tokyo',
    followers: 1700000, price_min: 600, price_max: 2500,
    youtube_url: 'https://youtube.com/@yukitanaka',
    contact_info: 'yuki@demo.brandly',
  },
  {
    email: 'laila.hassan@demo.brandly',
    name:  'Laila Hassan',
    avatar: 'https://randomuser.me/api/portraits/women/79.jpg',
    bio: 'Travel journalist and photographer. I document hidden gems across the Middle East, Asia, and Europe — always off the beaten path.',
    category: 'Travel', country: 'United Arab Emirates', city: 'Dubai',
    followers: 430000, price_min: 400, price_max: 1600,
    instagram_url: 'https://instagram.com/lailahassan',
    contact_info: 'laila@demo.brandly',
  },
  {
    email: 'emma.johansson@demo.brandly',
    name:  'Emma Johansson',
    avatar: 'https://randomuser.me/api/portraits/women/18.jpg',
    bio: 'Minimalist lifestyle creator based in Stockholm. Interior design, sustainable fashion, and slow living — content that breathes.',
    category: 'Lifestyle', country: 'Sweden', city: 'Stockholm',
    followers: 780000, price_min: 450, price_max: 1800,
    instagram_url: 'https://instagram.com/emmajohansson',
    contact_info: 'emma@demo.brandly',
  },
  {
    email: 'priya.sharma@demo.brandly',
    name:  'Priya Sharma',
    avatar: 'https://randomuser.me/api/portraits/women/91.jpg',
    bio: 'Beauty and skincare creator with a science-first approach. I review ingredients, bust myths, and help my followers build routines that actually work.',
    category: 'Beauty & Skincare', country: 'India', city: 'Mumbai',
    followers: 2800000, price_min: 900, price_max: 3500,
    instagram_url: 'https://instagram.com/priyasharma',
    tiktok_url: 'https://tiktok.com/@priyasharma',
    contact_info: 'priya@demo.brandly',
  },
  {
    email: 'jordan.blake@demo.brandly',
    name:  'Jordan Blake',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    bio: 'Personal trainer, marathon runner, and nutrition nerd. My content is practical — real workouts, real meals, real results from a real person.',
    category: 'Health & Fitness', country: 'United States', city: 'Austin',
    followers: 650000, price_min: 350, price_max: 1400,
    youtube_url: 'https://youtube.com/@jordanblake',
    instagram_url: 'https://instagram.com/jordanblake',
    contact_info: 'jordan@demo.brandly',
  },
  {
    email: 'isabela.moraes@demo.brandly',
    name:  'Isabela Moraes',
    avatar: 'https://randomuser.me/api/portraits/women/37.jpg',
    bio: 'Food traveler and recipe creator from São Paulo. I explore local cuisines across Latin America and bring the flavors home for my followers.',
    category: 'Food & Travel', country: 'Brazil', city: 'São Paulo',
    followers: 390000, price_min: 250, price_max: 900,
    instagram_url: 'https://instagram.com/isabelamoraes',
    contact_info: 'isabela@demo.brandly',
  },
  {
    email: 'felix.wagner@demo.brandly',
    name:  'Felix Wagner',
    avatar: 'https://randomuser.me/api/portraits/men/61.jpg',
    bio: 'Tech and productivity YouTuber from Berlin. I cover developer tools, productivity systems, and the hardware setups of people doing interesting work.',
    category: 'Technology', country: 'Germany', city: 'Berlin',
    followers: 520000, price_min: 400, price_max: 1500,
    youtube_url: 'https://youtube.com/@felixwagner',
    contact_info: 'felix@demo.brandly',
  },
  {
    email: 'chloe.dupont@demo.brandly',
    name:  'Chloé Dupont',
    avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
    bio: 'Paris-based fashion and street style creator. Quick outfit videos, thrift hauls, and trend breakdowns that feel personal, not editorial.',
    category: 'Fashion & Beauty', country: 'France', city: 'Lyon',
    followers: 1500000, price_min: 600, price_max: 2200,
    tiktok_url: 'https://tiktok.com/@chloe.dupont',
    contact_info: 'chloe@demo.brandly',
  },
  {
    email: 'omar.siddiqui@demo.brandly',
    name:  'Omar Siddiqui',
    avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
    bio: 'Founder, investor, and content creator. I share what I have learned building startups and talk to people doing remarkable things.',
    category: 'Business & Entrepreneurship', country: 'United Kingdom', city: 'London',
    followers: 460000, price_min: 500, price_max: 2000,
    instagram_url: 'https://instagram.com/omarsiddiqui',
    youtube_url: 'https://youtube.com/@omarsiddiqui',
    contact_info: 'omar@demo.brandly',
  },
  {
    email: 'mei.lin@demo.brandly',
    name:  'Mei Lin',
    avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
    bio: 'Wellness and beauty creator with a focus on traditional and modern skincare blends. Calm, intentional content for people who care about what they put on their skin.',
    category: 'Beauty & Skincare', country: 'Singapore', city: 'Singapore',
    followers: 3100000, price_min: 1000, price_max: 4000,
    instagram_url: 'https://instagram.com/meilin',
    tiktok_url: 'https://tiktok.com/@meilin',
    contact_info: 'mei@demo.brandly',
  },
  {
    email: 'luca.rossi@demo.brandly',
    name:  'Luca Rossi',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    bio: 'Outdoor adventure photographer and hiking guide from the Italian Alps. I document remote trails, wild camping, and the gear that makes it possible.',
    category: 'Outdoors & Adventure', country: 'Italy', city: 'Trento',
    followers: 310000, price_min: 200, price_max: 800,
    instagram_url: 'https://instagram.com/lucarossi',
    youtube_url: 'https://youtube.com/@lucarossi',
    contact_info: 'luca@demo.brandly',
  },
];

// ── Demo advertisers ──────────────────────────────────────────────────────────
const ADVERTISERS = [
  { email: 'sarah.mitchell@novaskin.demo', name: 'Sarah Mitchell' },
  { email: 'daniel.park@techflow.demo',    name: 'Daniel Park'    },
  { email: 'anna.kovacs@greenbite.demo',   name: 'Anna Kovacs'    },
];

// ── Demo ratings ─────────────────────────────────────────────────────────────
// [advertiser_index, influencer_index (by email key), score, review]
const RATINGS_PLAN = [
  // Sarah (NovaSkin) rates beauty/fashion creators
  [0, 'sophie.laurent@demo.brandly',  5, 'Sophie was an absolute dream to work with. Her audience engagement was incredible and sales from her post exceeded our target by 40%.'],
  [0, 'priya.sharma@demo.brandly',    5, 'Priya brings real credibility to skincare content. Her followers trust her recommendations and that trust transferred to our brand.'],
  [0, 'chloe.dupont@demo.brandly',    4, 'Great content, strong aesthetic. The TikTok video got over 2M views. Would definitely work together again.'],
  [0, 'mei.lin@demo.brandly',         5, 'Mei Lin delivered the campaign on time with beautiful photography. Conversion rate was the best we have seen from any influencer.'],
  [0, 'emma.johansson@demo.brandly',  4, 'The Instagram reel fit our brand perfectly. Emma\'s minimalist aesthetic was exactly what we needed for the launch.'],

  // Daniel (TechFlow) rates tech/productivity creators
  [1, 'marcus.webb@demo.brandly',     5, 'Marcus gave our product a completely honest review and it still performed brilliantly. His audience trusted it exactly because it was not a scripted ad.'],
  [1, 'felix.wagner@demo.brandly',    5, 'Felix produced a 15-minute in-depth video that drove more trial signups than any other channel we used. Exceptional value.'],
  [1, 'yuki.tanaka@demo.brandly',     4, 'The gaming audience overlap with our dev tool was surprising and it worked really well. Yuki\'s integration was natural and not forced.'],
  [1, 'omar.siddiqui@demo.brandly',   5, 'Omar\'s reach in the startup community is unmatched. The newsletter mention alone brought 800 new signups. Highly recommend.'],
  [1, 'jordan.blake@demo.brandly',    4, 'We partnered Jordan for our productivity app launch and his disciplined audience converted really well. Creative execution was excellent.'],

  // Anna (GreenBite) rates food/lifestyle creators
  [2, 'isabela.moraes@demo.brandly',  5, 'Isabela created the most beautiful recipe content we have ever received from an influencer. Engagement was off the charts.'],
  [2, 'diego.fuentes@demo.brandly',   5, 'Diego\'s authentic approach to food storytelling made our product feel at home in his content. We got 3x our expected reach.'],
  [2, 'alina.park@demo.brandly',      4, 'Fantastic fitness creator with a very engaged audience. The healthy meal prep angle worked perfectly for our brand positioning.'],
  [2, 'laila.hassan@demo.brandly',    4, 'Laila\'s travel food content was a perfect fit for our brand story. Her photography made every shot feel editorial quality.'],
  [2, 'luca.rossi@demo.brandly',      5, 'Luca captured our outdoor nutrition product in the most stunning mountain settings. The content went viral in the hiking community.'],
];

// ── Demo conversations & messages ─────────────────────────────────────────────
// Each entry: [advertiser_index, influencer_email, [...messages as [role, text]]]
const CONVERSATIONS = [
  [0, 'sophie.laurent@demo.brandly', [
    ['advertiser', 'Hi Sophie! I am Sarah from NovaSkin. We are launching a new vitamin C serum next month and your aesthetic aligns perfectly with our brand. Would you be open to a collaboration?'],
    ['blogger',    'Hi Sarah! Thank you for reaching out, I love NovaSkin\'s packaging — very elegant. What kind of content are you looking for? A dedicated post, or would you like me to integrate it into a routine reel?'],
    ['advertiser', 'We were thinking a 60-second reel showing your morning skincare routine with the serum as the hero product. We can send 3 products for gifting plus a flat fee. Would that work?'],
    ['blogger',    'That sounds great. My rate for a dedicated reel is €1,200 with full usage rights for 6 months. I can also include a swipe-up story series for an additional €300. Does that fit your budget?'],
    ['advertiser', 'That works! Let me get the contract over to you. Can you target a go-live date around the 15th of next month?'],
    ['blogger',    'Perfect, I will block that date. Send the brief and I will get started on the concept this week. Excited to work together!'],
  ]],
  [1, 'marcus.webb@demo.brandly', [
    ['advertiser', 'Hey Marcus, Daniel here from TechFlow. We are building a developer-focused project management tool and think your audience would genuinely find it useful. Any chance you would be interested in reviewing it?'],
    ['blogger',    'Hi Daniel! I have actually been looking for a better tool myself — the timing is funny. Is this a sponsored review or are you open to me giving an honest take regardless of outcome?'],
    ['advertiser', 'Honest take, 100%. We would rather have a real review than a polished ad. We can give you 3 months free access and a fee for the video if you decide to cover it.'],
    ['blogger',    'I respect that approach. Send me access and give me 2 weeks to actually use it in my workflow. If it does what it says, I will make the video. My standard YouTube rate is $1,800 for a sponsored segment.'],
    ['advertiser', 'Deal. I am sending credentials now. No pressure on the timeline — we want it to feel authentic.'],
  ]],
  [1, 'yuki.tanaka@demo.brandly', [
    ['advertiser', 'Hey Yuki! We have a productivity app that is gaining traction with the gaming community — devs who game. Would you consider an integration in one of your upcoming videos?'],
    ['blogger',    'That is an interesting angle. Most of my audience uses both sides of that world. What does the integration look like? I do not do hard sells in my videos.'],
    ['advertiser', 'We are thinking a 90-second segment where you show how you track your streaming schedule and game dev projects with the app. Very natural, your workflow.'],
    ['blogger',    'I can do that. My rate for a mid-roll integration like that is ¥200,000. I will script the segment myself to keep it feeling native to the video.'],
    ['advertiser', 'That works for us. Can we review the script before filming just to check accuracy — not to change your voice?'],
    ['blogger',    'Of course, that is my standard process anyway. Let me finish the current video and I will pitch a concept doc to you by Friday.'],
  ]],
  [2, 'isabela.moraes@demo.brandly', [
    ['advertiser', 'Olá Isabela! I am Anna from GreenBite, a plant-based meal kit company. I have been following your food content for months and think there is a real connection with what we do. Interested?'],
    ['blogger',    'Oi Anna! I love this, I have actually been eating more plant-based lately. Tell me about the product — what makes GreenBite different from the other kits out there?'],
    ['advertiser', 'We source every ingredient from small family farms in Brazil and Argentina. The focus is on traditional Latin American recipes reimagined with entirely plant ingredients. Authentic, not generic.'],
    ['blogger',    'That is exactly the kind of story I love to tell. I would want to feature the sourcing story, not just the cooking. Would you be open to content that goes deeper than a recipe?'],
    ['advertiser', 'That is literally our dream brief. We would love a short documentary-style reel if you are up for it. Budget is flexible for the right approach.'],
    ['blogger',    'Let me send you a concept proposal. I am thinking a 3-part series: farm, kitchen, table. That kind of content always performs really well for my audience.'],
  ]],
  [0, 'alina.park@demo.brandly', [
    ['advertiser', 'Hi Alina! Sarah from NovaSkin. We are expanding into body care and want to partner with fitness creators who also care about skin. Your content is exactly right for this.'],
    ['blogger',    'Hi Sarah! Body care is such an underrated part of fitness content — I have been wanting to talk about it more. What products are in the line?'],
    ['advertiser', 'A post-workout body lotion, a mineral sunscreen for outdoor training, and a muscle recovery balm. All clean ingredients, all tested by athletes.'],
    ['blogger',    'The recovery balm sounds especially interesting to me — I get a lot of questions from followers about muscle soreness. Could I focus the content around that specifically?'],
    ['advertiser', 'Absolutely. A TikTok showing your recovery routine featuring the balm would be perfect. We can send a full kit and discuss the fee once you have tried the product.'],
  ]],
];

// ── Seed function ─────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  try {
    const { rows } = await db.query("SELECT COUNT(*) AS n FROM users WHERE role='blogger'");
    if (parseInt(rows[0].n) >= 10) return; // already seeded

    console.log('Seeding demo data…');

    // Insert influencers
    const bloggerIds = {};
    for (const inf of INFLUENCERS) {
      const { rows: u } = await db.query(
        `INSERT INTO users (email, password_hash, role, display_name)
         VALUES ($1,$2,'blogger',$3)
         ON CONFLICT (email) DO UPDATE SET display_name=EXCLUDED.display_name
         RETURNING id`,
        [inf.email, PASS, inf.name]
      );
      const uid = u[0].id;
      bloggerIds[inf.email] = uid;

      await db.query(
        `INSERT INTO blogger_profiles
           (user_id, display_name, avatar_url, bio,
            tiktok_url, youtube_url, instagram_url,
            category, country, city, follower_count,
            price_min, price_max, contact_info)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (user_id) DO UPDATE
           SET display_name=EXCLUDED.display_name,
               avatar_url=EXCLUDED.avatar_url,
               bio=EXCLUDED.bio,
               category=EXCLUDED.category,
               country=EXCLUDED.country,
               city=EXCLUDED.city,
               follower_count=EXCLUDED.follower_count,
               price_min=EXCLUDED.price_min,
               price_max=EXCLUDED.price_max,
               contact_info=EXCLUDED.contact_info`,
        [
          uid, inf.name, inf.avatar, inf.bio,
          inf.tiktok_url    || null,
          inf.youtube_url   || null,
          inf.instagram_url || null,
          inf.category, inf.country, inf.city,
          inf.followers, inf.price_min, inf.price_max,
          inf.contact_info,
        ]
      );
    }

    // Insert advertisers
    const advertiserIds = [];
    for (const adv of ADVERTISERS) {
      const { rows: u } = await db.query(
        `INSERT INTO users (email, password_hash, role, display_name)
         VALUES ($1,$2,'advertiser',$3)
         ON CONFLICT (email) DO UPDATE SET display_name=EXCLUDED.display_name
         RETURNING id`,
        [adv.email, PASS, adv.name]
      );
      advertiserIds.push(u[0].id);
    }

    // Insert ratings
    for (const [advIdx, bloggerEmail, score, review] of RATINGS_PLAN) {
      const advId     = advertiserIds[advIdx];
      const bloggerId = bloggerIds[bloggerEmail];
      if (!advId || !bloggerId) continue;
      await db.query(
        `INSERT INTO ratings (advertiser_id, blogger_id, score, review)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (advertiser_id, blogger_id) DO NOTHING`,
        [advId, bloggerId, score, review]
      );
    }

    // Insert conversations & messages
    for (const [advIdx, bloggerEmail, messages] of CONVERSATIONS) {
      const advId     = advertiserIds[advIdx];
      const bloggerId = bloggerIds[bloggerEmail];
      if (!advId || !bloggerId) continue;

      const { rows: conv } = await db.query(
        `INSERT INTO conversations (advertiser_id, blogger_id)
         VALUES ($1,$2)
         ON CONFLICT (advertiser_id, blogger_id) DO UPDATE SET advertiser_id=EXCLUDED.advertiser_id
         RETURNING id`,
        [advId, bloggerId]
      );
      const convId = conv[0].id;

      // Only seed messages if conversation is new (empty)
      const { rows: existing } = await db.query(
        'SELECT COUNT(*) AS n FROM messages WHERE conversation_id=$1', [convId]
      );
      if (parseInt(existing[0].n) > 0) continue;

      for (const [role, content] of messages) {
        const senderId = role === 'advertiser' ? advId : bloggerId;
        await db.query(
          'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1,$2,$3)',
          [convId, senderId, content]
        );
      }
    }

    console.log(`Demo data seeded: ${INFLUENCERS.length} influencers, ${ADVERTISERS.length} advertisers, ${RATINGS_PLAN.length} ratings, ${CONVERSATIONS.length} conversations.`);
  } catch (e) {
    console.error('Seed error (non-fatal):', e.message);
  }
}

module.exports = { seedIfEmpty };

// Run directly: node seed.js
if (require.main === module) {
  const { checkConnection } = require('./db');
  (async () => {
    await checkConnection();
    await seedIfEmpty();
    process.exit(0);
  })();
}

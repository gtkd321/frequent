window.BRANCHES.find(b=>b.id==='business').skills.push(["biz_sales","Sales & follow-up"]);
window.STAGES=["New","Talked","Interested","Offer made","Won","Not now"];
window.BIZ=[
{id:"ride",name:"Ride concessions",short:"Rides",
 lede:"Snacks, water and chargers in the car, paid by card. Riders only ever buy products. Every ride still goes through the Uber app.",
 rules:"Uber’s guidelines prohibit asking riders to pay outside the app for trips, or giving them your contact details so they’ll book rides with you directly. Keep this to products, let riders bring it up, and never pitch rides.",
 rulesUrl:"https://help.uber.com/en/riders/article/a-driver-asked-me-to-take-a-trip-outside-of-uber?nodeId=2078c6f9-1e4b-473e-9bc7-e62982fb942c",
 steps:[
  ["Read Uber’s Community Guidelines and write your rule in one line: products only, no off-app rides.","https://www.uber.com/us/en/safety/uber-community-guidelines/"],
  ["Get a South Carolina Retail License ($50 through MyDORWAY). If you sell in North Carolina too, check NC’s rules.","https://scbos.sc.gov/business-compliance/licenses/retail-license"],
  ["Pick six items, all sealed and prepackaged: for example water, mints, gum, a phone cable, a granola bar and one Greek snack.",""],
  ["Buy one case of each from a warehouse store and price everything at round dollars.",""],
  ["Set up card or phone payment with a QR code (Square, Venmo Business or similar).",""],
  ["Make a small console display with a price card. Don’t pitch. Let riders ask.",""],
  ["Log every sale here for two weeks, along with how many rides you gave that shift.",""],
  ["Review: dollars per shift and which items sold. Drop the slowest two.",""],
  ["Add the olive-oil tasting card (in this tab) so curious riders can opt in by texting you.",""]],
 scripts:[
  ["If a rider notices the display","“Help yourself to a water. Snacks and chargers are on the card, and you can tap to pay.”"],
  ["If they ask about the olive oil card","“My family grows olives in Greece. I host small tastings around town. If you want an invite, text OLIVE to the number on the card.”"],
  ["What not to say","Anything about rides outside the app: no “text me next time,” no cards for trips, no cash for fares."]]},
{id:"oil",name:"Olive oil",short:"Olive oil",
 lede:"Tastings first, then bottles. Every tasting is a lead source, and every lead gets a follow-up within 48 hours.",
 rules:"",rulesUrl:"",
 steps:[
  ["Write the offer in two lines: what someone gets at a tasting, and what a bottle or case costs.",""],
  ["Decide on supply: which oils you’ll sell and from whom (your relatives’ groves or partner producers). If you import, check FDA food-import rules first.","https://www.fda.gov/food/food-imports-exports/importing-food-products-united-states"],
  ["Get the SC Retail License if you don’t already have one from the Rides tab.","https://scbos.sc.gov/business-compliance/licenses/retail-license"],
  ["Book one tasting date this month and use your tasting app to score the oils.","https://gtkd321.github.io/olive-tastings/"],
  ["At every tasting, collect names and a phone number or email from anyone who opts in, and add them here the same night.",""],
  ["List 20 local targets: restaurants, chefs, gourmet shops, your church festival and farmers markets.",""],
  ["Visit or message five targets a week with the 10-minute tasting offer.",""],
  ["Follow up every lead within 48 hours with one specific next step.",""],
  ["Take pre-orders before you order stock. Collect the money first, then buy.",""],
  ["After 30 days, review which source produced paying customers and double down on it.",""]],
 scripts:[
  ["Restaurant or chef","“Hi, I’m Daniel. My family produces olive oil in Greece. Could I bring three oils for a 10-minute tasting at a slow hour? No pitch until you’ve tasted.”"],
  ["After a tasting (text)","“Great to meet you at the tasting. You liked the [oil]. I’m putting in an order on [date]. Want me to hold a bottle or a case for you?”"],
  ["Gentle second follow-up","“Just checking in before I close the order on [date]. No pressure, and I’ll invite you to the next tasting either way.”"]]},
{id:"tour",name:"Olive oil tour",short:"Tour",
 lede:"One trip, one date, one partner. Sell to people who have already tasted your oil, and decide go or no-go by a fixed date.",
 rules:"Under EU law, whoever organizes a package (for example lodging plus guided visits) must carry insolvency protection. The simplest way in is to have a licensed Greek tour operator act as the organizer while you design the trip, host it and bring the guests.",
 rulesUrl:"https://commission.europa.eu/law/law-topic/consumer-protection-law/travel-and-timeshare-law/package-travel-directive_en",
 steps:[
  ["Choose one product: the 7-day olive oil field course or the chef harvest trip. Write it in three lines.",""],
  ["Pick dates for harvest season, plus a go/no-go date 90 days before departure.",""],
  ["Contact three licensed Greek tour operators about acting as organizer and taking bookings, while you curate and host.","https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/package-travel/index_en.htm"],
  ["Confirm four or five producers, with dates and per-person prices for visits, tastings and meals.",""],
  ["Build a cost sheet with your fee and a minimum group size (for example 8).",""],
  ["Write a one-page plan with the day-by-day route, price, what’s included and how to reserve.",""],
  ["Start a warm list: tasting guests, Greek students, church friends and chef contacts. Add each one here as a lead.",""],
  ["Have 20 one-on-one conversations, aiming for 5 deposits through the partner by the go/no-go date.",""],
  ["Share three short posts or videos from your tastings and the groves.",""],
  ["Go/no-go: if you hit the minimum, confirm. If not, run a smaller friends-and-family pilot or move the date.",""]],
 scripts:[
  ["Warm invitation","“We’re taking eight people to Greece for harvest week next fall: farms, mills, bread and oil with the families who make it. I’m putting together a short interest list. Want the one-page plan?”"],
  ["After they read the plan","“What would make this a yes for you: the dates, the price or something else?”"],
  ["Deposit ask","“Spots are held with a deposit through our Greek partner, who handles bookings and traveler protection. Should I send you the link?”"]]}
];
/* ---- Frequent series business ---- */
window.BIZ.push({id:"freq",name:"Frequent series",short:"Frequent",
 lede:"Build the series around bridges, not competition. Learners who finish an audio course like Language Transfer still can’t read. Greekquent takes them from pre-literate to reading, and the other Frequent apps can do the same for each language Language Transfer teaches.",
 rules:"Language Transfer is free and funded by learner donations, and its creator says he can’t answer every email. Keep the first message short, show the bridge working, and ask for nothing that costs him money.",
 rulesUrl:"https://www.languagetransfer.org/contact",
 steps:[
  ["Write the bridge in three sentences: Language Transfer’s Complete Greek teaches spoken Greek only, without the alphabet. Greekquent teaches reading phonetics-first, through stories.","https://www.classcentral.com/report/best-greek-courses"],
  ["Map the bridge: which Language Transfer tracks a learner should finish before each Greekquent reading unit. One table, one page.","https://www.languagetransfer.org/greek"],
  ["Record a 3-minute screen video of the first Greekquent reading lesson, as a learner coming from Language Transfer would see it.",""],
  ["Read the Actual Fluency interview with Mihalis Eleftheriou about funding and his plans before writing to him.","https://actualfluency.com/podcast/language-transfer-mihalis-eleftheriou"],
  ["Send the short email in Scripts to info@languagetransfer.org, with the video and the one-page map. Add Mihalis as a lead here.","https://www.languagetransfer.org/contact"],
  ["If there’s no reply in 14 days, send one follow-up, or a LinkedIn note mentioning his Round Table sessions for new languages.","https://www.linkedin.com/in/mihalis-eleftheriou-30802970"],
  ["Write to Alan Robert White, who published an evaluation of the Language Transfer Greek course in 2026. Ask whether he’d look at the reading bridge with the same lens.","https://sciety.org/articles/activity/10.35542/osf.io/hnvwe_v1"],
  ["Offer a free pilot of the reading bridge to the Holy Trinity Greek School in Columbia (1931 Sumter St, 803-252-6758): five adult learners or parents, four weeks.","https://www.goarch.org/en/organizations/greekschools"],
  ["Have three of the conversations under People to talk to, then decide how Greekquent makes money (see Ways to fund it). Write the decision in one line.",""],
  ["Pick the next language in the series to match a Language Transfer course: Spanish, French, Italian, German, Turkish, Arabic or Swahili.","https://www.languagetransfer.org/"]],
 scripts:[
  ["First email to Mihalis (subject: A reading bridge for Complete Greek learners)","Γεια σου Μιχάλη, I’m Daniel, a Greek-American teaching Greek in South Carolina. My students start with your Complete Greek, and the one thing they ask for next is reading. I built Greekquent to fill that gap: phonetics-first reading through short stories, picking up where a Language Transfer learner is. Here’s a 3-minute video and a one-page map of which tracks lead into which reading units. Two questions: does this fit the spirit of the Thinking Method, and would you be open to a 30-minute call? I’d also value your frank view on charging versus your donation model. No ask beyond your opinion. Ευχαριστώ, Daniel"],
  ["Follow-up after 14 days","“Just floating this back up in case it got buried. The 3-minute video is the quickest way to see it. If now isn’t the time, no problem at all.”"],
  ["Call agenda (30 minutes)","1) Who I am and why the reading gap matters, 3 min. 2) Show the bridge on screen, 10 min. 3) His honest critique: what breaks the Thinking Method, 7 min. 4) Money, frankly: the questions below, 7 min. 5) One next step, or a clear no, 3 min."],
  ["Frank questions on free versus paid","What has donations-only made possible that charging would have blocked? What has it cost you in time or stability? Would a paid bridge app clash with Language Transfer’s ‘genuinely free’ promise, and would it need a free path for your learners? Which brought in more: Patreon, the non-shop or company workshops? Would you prefer a two-way link, a shared free lesson, or nothing formal? What are your conditions for anyone citing the Thinking Method?"],
  ["Thank-you note (within 24 hours)","“Thank you for the time and the honesty. What I heard: [two points]. What I’ll do next: [one step] by [date]. I’ll send you the revised lesson when it’s ready, and you’re free to pass.”"],
  ["To Easy Greek (Dimitris and Marilena)","“I teach Greek in South Carolina and built a phonetics-first reading app for learners before they can follow your street interviews. Would you be open to a cross-link: my learners graduate to Super Easy Greek, and your beginners get a free way to learn to read?”"]]
});
window.FREQ={
 people:[
  {n:"Mihalis Eleftheriou",r:"Creator of Language Transfer (Thinking Method), Greek-Cypriot, based in Asturias, Spain",why:"His Complete Greek is spoken only, so learners leave without the alphabet. That is exactly where Greekquent starts.",ask:"Evaluate the bridge, discuss a two-way link, and talk frankly about donations versus charging.",how:"info@languagetransfer.org, or LinkedIn",u:"https://www.languagetransfer.org/about"},
  {n:"Alan Robert White",r:"Author of a 2026 evaluation of the Language Transfer Greek course",why:"He already studies how this course works. An outside evaluation makes the bridge credible.",ask:"Would he review the reading bridge, or co-design a small learner study?",how:"Through the preprint page",u:"https://sciety.org/articles/activity/10.35542/osf.io/hnvwe_v1"},
  {n:"Dimitris Hall and Marilena Salamanou",r:"Easy Greek: Athens street interviews and podcasts, funded by Patreon",why:"Their videos are the natural next step after learning to read, and their Patreon model is a clear example of free content with paid extras.",ask:"A cross-link, and what Patreon members actually pay for (transcripts, exercises).",how:"Patreon page or Easy Languages site",u:"https://www.easy-languages.org/easy-greek"},
  {n:"Pablo Román",r:"Creator of Dreaming Spanish: graded comprehensible-input video",why:"A free tier plus a $7.99 per month premium. It’s the clearest working model of free-to-start, paid-for-volume.",ask:"How he set the free/paid line, and how he grades levels.",how:"Dreaming site or YouTube",u:"https://www.dreaming.com/faq"},
  {n:"Evan Gardner",r:"Where Are Your Keys: an open-source fluency game built for endangered languages",why:"Game techniques that train every learner to become a teacher, which suits your classroom and future teachers.",ask:"Which techniques fit a reading bridge, and how an open-source method sustains itself.",how:"Where Are Your Keys site",u:"https://whereareyourkeys.org/where-are-your-keys/"},
  {n:"Christophe Rico",r:"Dean of the Polis Institute, Jerusalem: Koine Greek taught as a living language",why:"A Koine track, the Greek of the New Testament, links Greekquent to Psaltiquent and to church learners.",ask:"Whether a modern-to-Koine reading bridge makes sense, and teacher training.",how:"Polis Institute site",u:"https://www.polisjerusalem.org/language/ancient-greek/"},
  {n:"Blaine Ray",r:"Creator of TPRS: teaching through asked stories",why:"Your listening-to-speaking story routine is close to TPRS. His books and workshops are a paid model built on stories.",ask:"How to turn the story routine into teacher materials others can buy.",how:"TPRS Books site",u:"https://www.tprsbooks.com/the-fastest-way-to-fluency-how-tprs-2-0-is-transforming-language-teaching/"},
  {n:"Holy Trinity Greek School, Columbia",r:"Greek school at Holy Trinity Greek Orthodox Cathedral, 1931 Sumter St, 803-252-6758",why:"Local learners and parents, 20 minutes away. A real place to test the bridge.",ask:"A free four-week pilot with adult learners or parents.",how:"Call the church office",u:"https://www.goarch.org/en/organizations/greekschools"}],
 money:[
  ["Donations only (Language Transfer)","Everything free, funded by learners on Patreon. Reported at about $1,600 a month, plus a non-shop and paid company workshops.","https://kinescope.com/edtech-map/languagetransfer"],
  ["Free plus premium (Dreaming Spanish)","A real free tier. Premium is $7.99 a month for the full library, daily videos and offline listening.","https://app.dreaming.com/spanish/premium"],
  ["Free content, paid extras (Easy Greek)","Videos are free. Patreon tiers start around €4–6 a month for transcripts, exercises and downloads.","https://www.easy-languages.org/easy-greek"],
  ["A fit for Greekquent","Keep the reading bridge free for Language Transfer learners. Charge for live classes, printed story cards and teacher kits."]],
 study:[
  ["Thinking Method (Language Transfer)","Guided reasoning out loud, with no memorizing. Study how it sequences structures.","https://www.languagetransfer.org/about"],
  ["Comprehensible input","Large amounts of understandable input, graded by level (Krashen; Dreaming Spanish).","https://www.dreaming.com/faq"],
  ["TPRS","Establish meaning, ask a story, then read it. Close to your story routine.","https://methodsoflanguageteaching.byu.edu/teaching-proficiency-and-reading-through-storytelling-tprs"],
  ["Where Are Your Keys","Gesture-backed question and answer games, and learners trained as teachers.","https://lx.berkeley.edu/sites/default/files/gardner_ciotti_2018_wayk.pdf"],
  ["Polis method","Full immersion, TPR and storytelling applied to Koine Greek.","https://www.polisjerusalem.org/resurrecting-ancient-languages-interview-with-teachers-of-the-polis-institute-jerusalem/"]]
};

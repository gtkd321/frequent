window.BRANCHES.push({id:"life",name:"Life & promises",occ:null,pay:null,payN:0,url:null,
 skills:[["life_promise","Promises kept"],["life_trade","The paper clip game"]]});
const CLIP_GAME={
 story:"In July 2005 Kyle MacDonald posted a photo of one red paper clip and asked for something bigger or better. Two women in Vancouver traded him a fish-shaped pen. Fourteen trades later (a doorknob, a camp stove, a generator, a snowmobile, an afternoon with Alice Cooper, a snow globe, a movie role) the town of Kipling, Saskatchewan traded him a house. He got the idea from a childhood game called Bigger and Better.",
 caveat:"The economist Tyler Cowen pointed out that the house wasn’t free: MacDonald worked more than full time for a year, and many people traded for the story and the attention. So play it as a people game. The real prize is a year of conversations with strangers.",
 rules:[
  "Carry one real red paper clip. That’s trade zero.",
  "Each trade has to feel bigger or better to both of you. Value can be useful, beautiful, funny or a good story.",
  "Every trade is a conversation first. Ask what they’d love to have and what the item means to them.",
  "Trade in person or in barter groups: neighbors, church, the gym after your workout, Facebook Marketplace, Craigslist barter. Not with riders during Uber trips.",
  "Offer your current item to three people a week. A no still counts as practice.",
  "Write down one thing you learned about each person. That’s character research for your fiction."],
 post:"Trading up, one swap at a time. I started with one red paper clip and I’m trading for something bigger or better each time, to see how far it goes. Right now I have: [ITEM]. Want to trade? I’ll meet you locally, and I’ll tell you the story of every trade so far.",
 links:[{t:"NPR: From a paper clip to a house",u:"https://www.npr.org/2006/09/04/5763262/from-a-paper-clip-to-a-house-bartering-on-the-web"},{t:"CBC: 14 trades",u:"https://www.cbc.ca/news/canada/from-paper-clip-to-house-in-14-trades-1.573973"},{t:"UBC Arts: the Bigger and Better game",u:"https://www.arts.ubc.ca/news/alum-kyle-macdonald-red-paperclip-guy/"}]
};
const CLIP_JAR={
 what:"For your promises, a second paper clip trick. Trent Dyrsmid kept two jars on his desk, one with 120 paper clips. After every sales call he moved one clip over, and he didn’t stop until the jar was empty. Each daily promise here has its own jar.",
 link:{t:"James Clear: the Paper Clip Strategy",u:"https://jamesclear.com/paper-clips"}
};
const COMPACT={
 sizes:[["pocket","Pocket",1],["shoebox","Shoebox",4],["box","Moving box",16],["big","Furniture",64]],
 what:"Turn a pile of knickknacks into one thing that’s worth more and takes up less. Put items on the shelf, group them into a bundle with a theme, then trade or sell the bundle and get one compact item you’ll actually use. The score is value per space: dollars per shoebox of room it takes.",
 rules:[
  "Price with sold listings, not asking prices. On eBay, search the exact item and tick Sold Items. Take the middle of the closest matches.",
  "Bundle around a buyer, not around your shelf. A baker’s box, an office starter kit, a hand-tool set or a box of records beats a random pile.",
  "Every bundle needs an anchor: the one item people notice first. The others make the deal stronger.",
  "Price the bundle about 10–20% under the sum of the separate prices, and use one photo that shows everything.",
  "High-value or one-of-a-kind items go alone. Small, cheap things go in lots.",
  "Trading the bundle straight for the item is best. Selling it, then buying the item, counts too.",
  "Broken, stained or missing pieces don’t go in a bundle. Toss or recycle them."],
 targets:[
  ["A quality voiceover microphone","Your audio studio, in the space of a coffee mug."],
  ["An e-reader","Stands in for a shelf of paperbacks you’ve already read."],
  ["One great chef’s knife","Replaces a drawer of gadgets."],
  ["Noise-canceling headphones","For writing sessions and the studio."],
  ["A good watch or a piece of gold or silver jewelry","Holds value and fits in a pocket."],
  ["An external SSD","After you photograph or digitize what the boxes held."],
  ["A fountain pen and a box of index cards","Your one-a-day card methods, upgraded."],
  ["Good shelving for the audio studio","A house prize: it makes room instead of taking it."],
  ["A quality vacuum","Another house prize, and it earns its spot."],
  ["A gift card or fund toward a flight to Greece","The most compact thing there is."]],
 fb:[
  "Marketplace listings need a price, so put the cash value and add “Open to trades” in the description, with what you’d want instead.",
  "Search Facebook for your area plus “buy sell trade” or “swap”, then filter to Groups. Read each group’s rules before posting.",
  "If a trade offer comes in, ask for a photo of the actual item first.",
  "Meet in a public, well-lit place. Check the item in person before you hand yours over."],
 links:[{t:"How-To Geek: check what something is worth on eBay",u:"https://www.howtogeek.com/721794/how-to-see-what-something-is-worth-using-ebay/"},{t:"CNBC: organizers on bundling low-value items",u:"https://www.cnbc.com/amp/make-it/2024/03/28/what-to-sell-donate-and-trash-according-to-professional-organizers.html"},{t:"DIYAuctions: bundle pricing and anchor items",u:"https://www.diyauctions.com/learn/bundle-pricing-strategy"}]
};
COMPACT.local=[
 {t:"Create a Marketplace listing",u:"https://www.facebook.com/marketplace/create/item",d:"Price required. Add “or trade” in the description."},
 {t:"Your Marketplace listings",u:"https://www.facebook.com/marketplace/you/selling",d:"Renew, mark sold, answer offers."},
 {t:"Browse Marketplace",u:"https://www.facebook.com/marketplace/",d:"Set location to Lexington, SC."},
 {t:"Buy Nothing Lexington / Gilbert, SC",u:"https://www.facebook.com/groups/817093378363014/",d:"Gifts only, no cash or trades. Use it for the give pile. Join one Buy Nothing group."},
 {t:"BuyNothing Project, Lexington and nearby",u:"https://www.facebook.com/groups/564270395687020/",d:"Alternative Buy Nothing group."},
 {t:"Lexington County SC Yard Sale",u:"https://www.facebook.com/groups/1739353189678873/",d:"Sales."},
 {t:"Midlands Auction, Buy, Sell, Trade and Give",u:"https://www.facebook.com/groups/798214963592545/",d:"Trades allowed."},
 {t:"Columbia SC Buy/Sell/Trade/Give Away",u:"https://www.facebook.com/groups/columbiascbuyselltradegiveaway/",d:"Trades allowed."},
 {t:"South Carolina Community Buy Sell and Trade",u:"https://www.facebook.com/groups/1853060961622862/",d:"Statewide."},
 {t:"Barnyard Flea Market Vendors, Lexington",u:"https://www.facebook.com/groups/barnyardfleamktvendors/",d:"For bigger lots and vendor contacts."},
 {t:"Find more Lexington groups",u:"https://www.facebook.com/search/groups/?q=Lexington%20SC%20buy%20sell%20trade",d:"Read each group’s rules first."},
 {t:"Buy Nothing app and directory",u:"https://buynothingproject.org/facebookgroups",d:""}];
COMPACT.localNote="Happenings in Lexington SC doesn’t allow selling personal items, so don’t post there.";
window.WARMUP={
 note:"“Dopamine stacking” is a pop term. What the research supports is narrower: pairing a treat with a hard task, music you love, moving first, morning light, and an if-then plan for the first action. Keep each piece small.",
 steps:[
  ["Light","Open the blinds or step outside for 5 minutes."],
  ["Cue","One sip of coffee and your start song. Same song every day."],
  ["Move","Two minutes: 20 squats, 20 jumping jacks or a lap of the yard. On Monday to Saturday, the 9 AM gym is the big dose."],
  ["If-then","Say it out loud: “After I put the cup down, I open ___.”"],
  ["Tiny start","Two minutes on that one thing. You can stop after two."],
  ["Celebrate","Say “Nice” or make a fist. Log the first win here."]],
 tips:[
  {t:"Bundle a treat with the hard thing",d:"Keep one playlist or audiobook only for your first work block or the gym. In the original study gym visits rose 51% at first, then faded. A 6,792-person follow-up found about 10–14% more weekly workouts.",s:[["Milkman et al. 2014","https://pmc.ncbi.nlm.nih.gov/articles/PMC4381662/"],["Kirgios et al. 2020","https://faculty.wharton.upenn.edu/wp-content/uploads/2017/07/TemptationBundling.pdf"]]},
  {t:"Use a start song",d:"Music you love releases dopamine twice: while you anticipate the best part, and at the peak itself. Pick a song whose build-up you know, and press play as you sit down.",s:[["Salimpoor et al., Nature Neuroscience","https://www.nature.com/articles/nn.2726"]]},
  {t:"A sip of coffee is a cue",d:"About 40 mg of caffeine (roughly half a small cup) improved alertness and attention in one trial. But Europe’s food-safety review found no consistent effect under 75 mg. So treat the sip as a ritual signal, and the real dose as a cup.",s:[["Smith et al. 1999","https://onlinelibrary.wiley.com/doi/abs/10.1002/(SICI)1099-1077(199910)14:7%3C473::AID-HUP129%3E3.0.CO;2-D"],["EFSA review","https://backend.orbit.dtu.dk/ws/files/103006331/Caffeine_and_alertness.pdf"]]},
  {t:"Get light early",d:"Bright morning light raised alertness and mood but not test scores, and morning light is linked to fewer depressive symptoms. Five minutes outside before the screen.",s:[["2026 light trial","https://www.medrxiv.org/content/10.64898/2026.07.04.26357282v1.full"],["npj review","https://www.nature.com/articles/s44323-025-00062-0"]]},
  {t:"Move before you focus",d:"In adults with ADHD, a single bout of exercise gave a moderate boost to impulse control. Thirty minutes of cycling improved attention. Your 9 AM gym is the warm-up. On Sunday, take a 10-minute walk.",s:[["2026 meta-analysis","https://pubmed.ncbi.nlm.nih.gov/41638541/"],["Cycling study","https://pmc.ncbi.nlm.nih.gov/articles/PMC6443849/"]]},
  {t:"Decide the first action the night before",d:"If-then plans (“After X, I will Y”) had a medium-to-large effect across 94 studies, and about the same for simply getting started.",s:[["NCI summary of Gollwitzer and Sheeran","https://cancercontrol.cancer.gov/brp/research/constructs/implementation-intentions"]]},
  {t:"Make it tiny, then celebrate",d:"Tiny Habits: anchor, tiny behavior, celebration. Honest caveat: celebration on its own hasn’t been tested in peer-reviewed trials. Habits took about 66 days on average to become automatic, ranging from 18 to 254.",s:[["Tiny Habits","https://tinyhabitsacademy.com/tiny-habits-book/"],["Behavioral Scientist","https://www.thebehavioralscientist.com/articles/fogg-behavior-model"]]},
  {t:"Log one small win early",d:"In 12,000 diary entries, making progress on meaningful work was the biggest lift to people’s motivation that day. Log the first win before 10 AM.",s:[["Amabile and Kramer, HBR","https://hbr.org/2011/05/the-power-of-small-wins"]]},
  {t:"Cold water is optional",d:"The often-quoted 250% dopamine rise came from sitting in 14°C water for an hour, measured in blood. There’s no good data for a 30-second shower. Do it only if you like it.",s:[["Šrámek et al. 2000","https://link.springer.com/article/10.1007/s004210050065"],["Claim check","https://dopamine.co.uk/checked/cold-showers/"]]}]
};

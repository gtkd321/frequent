/* Kitchen & money: meal prep that pays you, then pay future you */
window.BRANCHES.push({id:"money",name:"Kitchen & money",occ:"Personal financial advisors",pay:"$105,070/yr",payN:105070,url:"https://www.bls.gov/ooh/business-and-financial/personal-financial-advisors.htm",
 skills:[["money_prep","Meal prep"],["money_save","Spending less"],["money_invest","Paying future you"]]});
window.MONEY={
note:'Every meal from the fridge is money you did not spend. The app counts it, then asks you to move it where it grows.',
stat:['The average U.S. household spent $3,945 on food away from home in 2024, about $329 a month.','https://www.bls.gov/opub/ted/2026/housing-and-transportation-accounted-for-50-percent-of-household-spending-in-2024.htm'],
defaults:{out:14,home:4,day:6,goal:500},
days:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
/* four-week rotation, picked by the calendar so there is nothing to decide */
menus:[
 {n:'Salmon week',base:'Jasmine rice in the Instant Pot (1:1 water, 3 min high, 10 min release)',pro:'Teriyaki salmon, baked',veg:'Sheet-pan broccoli and carrots',fast:'Fakes: lentil soup',shop:['Rice','Salmon fillets','Teriyaki sauce or soy, honey, garlic','Broccoli','Carrots','Brown lentils','Onion, garlic, tomato paste, bay leaf','Olive oil']},
 {n:'Chicken week',base:'Jasmine rice in the Instant Pot',pro:'Sheet-pan chicken thighs with lemon and oregano',veg:'Stir-fry veg kit: peppers, onion, cabbage',fast:'Fasolada: white bean soup',shop:['Rice','Chicken thighs','Lemons, oregano','Bell peppers, onion, cabbage','Dried or canned white beans','Celery, carrot, tomato','Olive oil']},
 {n:'Egg and chickpea week',base:'Rice, double batch: half for fried rice',pro:'Jammy eggs, a dozen',veg:'Frozen peas and corn for fried rice, cucumber salad',fast:'Revithada: baked chickpeas',shop:['Rice','Eggs','Frozen peas and corn','Cucumbers','Dried or canned chickpeas','Onion, lemon, rosemary','Olive oil']},
 {n:'Freezer week',base:'Rice',pro:'Double pot of soup: freeze half',veg:'Greens sautéed with garlic',fast:'The soup itself, if you make it a bean soup',shop:['Rice','Soup ingredients x2','Spinach or chard','Garlic','Freezer containers or bags','Olive oil']}
],
flow:['Start the rice in the Instant Pot.','While it cooks: protein and veg on sheet pans at 425°F.','Bean or lentil pot on the stove for Wednesday and Friday.','Portion into containers: rice, protein, veg. Five lunches is the target.','Label with today’s date. Anything for day 4 or later goes in the freezer now.'],
fastNote:'Wednesdays, Fridays and fasting seasons: the bean pot is your meal. It is also the cheapest protein in the kitchen.',
quick:{n:'Rescue prep, 30 minutes',s:['Rice in the Instant Pot','Six jammy eggs while it cooks','A bag of frozen veg, microwaved','Three containers. Done.']},
safety:['Refrigerate within 2 hours of cooking.','Leftovers keep 3 to 4 days in the fridge, or 3 to 4 months frozen.','Reheat to 165°F.'],
safetySrc:['USDA: Leftovers and food safety','https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety'],
cooking:['Frequent Cooking: capsules and Instant Pot timers','https://gtkd321.github.io/frequent/cooking/'],
ladder:[
 {n:'Starter emergency fund',d:'A separate savings account, so it is easy to reach but not to spend. A first goal of $500.',src:['CFPB: start with $500','https://files.consumerfinance.gov/f/documents/cfpb_your-money-your-goals_savings_booklet_cobrand.pdf']},
 {n:'Grow it to 3 to 6 months of basic costs',d:'Rent, utilities, food and transportation. Keep adding after the first goal.',src:['Washington DFI: building an emergency fund','https://dfi.wa.gov/financial-education/information/importance-having-emergency-savings-account']},
 {n:'A Roth IRA in a low-cost index fund',d:'Up to $7,500 for 2026, and never more than you earned. Index funds track a market index and usually cost less than actively managed funds.',src:['IRS: 2026 IRA limits','https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits'],src2:['Investor.gov: index funds','https://www.investor.gov/introduction-investing/investing-basics/glossary/index-fund']}
],
disclaimer:'General education, not personal financial advice.',
autoSrc:['CFPB: make saving automatic','https://www.consumerfinance.gov/archive/blog/looking-easy-way-save-money-make-it-automatic/'],
moves:[
 {id:'auto',t:'Set up an automatic weekly transfer to savings, even $10',w:'Once it is set up, you save without deciding.'},
 {id:'sep',t:'Open a separate savings account for the emergency fund',w:'Separate is harder to spend.'},
 {id:'sub',t:'Cancel one subscription you did not use this month',w:'A small leak, closed for good.'},
 {id:'list',t:'Shop from this week’s prep list only',w:'The list is already written. No browsing.'},
 {id:'gym',t:'Pack a snack in the gym bag',w:'So 9 AM gym does not turn into a drive-thru.'},
 {id:'unit',t:'Check the unit price on your three most-bought items',w:'Store brand is often the same food.'},
 {id:'bills',t:'Write down every bill and its due date on one card',w:'One card, no surprises.'}
],
mealOutEvery:10
};

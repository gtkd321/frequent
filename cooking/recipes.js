// Frequent Cooking recipes. © 2026 Daniel Ilias Houlis. All rights reserved. Frequent is a trademark of Daniel Ilias Houlis.
// The path builds outward: capsules (made ahead, kept in the fridge) feed the dishes after them.
// kind: cap = capsule you make ahead, dish = a meal built from capsules.
// needs = capsules a dish is built on. opt = capsules that make it better if you have them.
// keep = days it lasts in the fridge. ing = [amount, unit, item]; amounts scale with the batch size.
// Steps can carry a timer: { x: text, t: minutes, tl: timer label }.
'use strict';
const ROUNDS = [
  ['Rice and a flavor base', 'Get the Instant Pot right first. Almost everything later sits on this rice.'],
  ['Salmon, cooked', 'One tray of salmon becomes three or four meals.'],
  ['Stir-fry night', 'A jar of sauce and a box of cut vegetables turn into dinner in ten minutes.'],
  ['Sushi without raw fish', 'Every capsule so far comes together here. Nothing raw yet.'],
  ['Raw salmon, when you are ready', 'Optional. Only with salmon sold for raw use.'],
];
const SRC = {
  ipJasmine: ['Instant Pot: Basic Jasmine Rice', 'https://instantpot.com/blogs/recipes/basic-jasmine-rice'],
  ipShort: ['Non-Guilty Pleasures: Instant Pot short-grain rice', 'https://www.nonguiltypleasures.com/instant-pot-sushi-rice/'],
  rice: ['Consumer Reports: Is leftover rice safe to eat?', 'https://www.consumerreports.org/health/food-safety/is-leftover-rice-safe-to-eat-a8310482886/'],
  eggs: ['Well Plated: Instant Pot boiled eggs', 'https://www.wellplated.com/instant-pot-boiled-eggs/'],
  fdaSea: ['FDA: Selecting and serving seafood safely', 'https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-fresh-and-frozen-seafood-safely'],
  fdaPar: ['FDA Fish and Fishery Products Hazards Guidance, ch. 5', 'https://www.fda.gov/media/80777/download'],
  vdh: ['Virginia Dept. of Health: Parasite destruction guidance', 'https://www.vdh.virginia.gov/content/uploads/sites/196/2024/05/Parasite-Destruction-Guidance_201811131534145610-1_202310061202094374_202310261552009004.pdf'],
  fdaAZ: ['FDA Food Safety A to Z (freezer at 0°F)', 'https://www.fda.gov/media/90663/download'],
};

const RECIPES = [
  // ---------- Round 1 ----------
  { id: 'rice', n: 'Instant Pot rice', kind: 'cap', r: 0, keep: 4, scale: true, time: 25, yields: 'About 6 cups cooked',
    why: 'The base for bowls, stir-fries and fried rice. Make a full batch and the rest of the week gets easy.',
    ing: [[2, 'cup', 'jasmine rice (or see twists)'], [2, 'cup', 'cold water, same cup as the rice'], [0.5, 'tsp', 'salt (optional)']],
    steps: [
      'Rinse the rice in a strainer or in the pot, swishing with your hand, until the water runs almost clear. Three or four changes of water.',
      'Drain well, then add the rice and the water to the inner pot. Measure with a cup, not the lines inside the pot. Press any grains on the wall down under the water.',
      'Close the lid and turn the valve to Sealing.',
      { x: 'Choose Pressure Cook (on some clones it says Manual), High, 3 minutes. Skip the Rice button; it runs its own program. The pot takes 5–10 minutes to build pressure before the countdown starts.', t: 3, tl: 'Rice at pressure' },
      { x: 'When it beeps, leave it alone: 10 minutes of natural release. The rice is still cooking.', t: 10, tl: 'Natural release' },
      'Turn the valve to Venting for any steam left, open, and fluff with a rice paddle or fork.',
      'For the week: spread the extra in a shallow container, fridge it uncovered until cold, then put the lid on. Do it within 2 hours of cooking.',
    ],
    twists: ['Jasmine, 3 min', 'Long-grain white, 4 min', 'Basmati, 4 min', 'Short-grain or Calrose, 5 min', 'Brown rice: 1¼ cups water per cup, 22 min', 'Cooked in broth'],
    tips: [
      'Rice to water stays 1 : 1 for white rice in a pressure cooker, because nothing boils away. Double or triple it and the time stays the same.',
      'Rice left out for hours can grow Bacillus cereus, whose toxin survives reheating. Refrigerate within 2 hours, eat within 3–4 days, reheat until steaming.',
      'Do not leave it on Keep Warm for hours. Small batches scorch and dry out on the bottom.',
    ],
    src: [SRC.ipJasmine, SRC.rice] },

  { id: 'aromatics', n: 'Garlic-ginger-scallion prep', kind: 'cap', r: 0, keep: 4, scale: true, time: 15, yields: 'About ½ cup, enough for 6–8 dishes',
    why: 'The flavor every stir-fry and fried rice starts with. Mince once, cook all week.',
    ing: [[1, '', 'head of garlic, peeled'], [1, '', 'thumb-size piece of ginger (about 2 inches)'], [1, '', 'bunch of scallions'], [2, 'Tbsp', 'neutral oil (canola, peanut, avocado)']],
    steps: [
      'Peel the ginger by scraping it with the edge of a spoon.',
      'Mince the garlic and ginger finely, by knife or in a mini chopper. Stir them with the oil in a small jar.',
      'Slice the scallions. Keep the white parts (they go in the pan) and the green parts (they go on top) in separate containers.',
      'Label the jar with today’s date and keep it in the fridge.',
    ],
    twists: ['Standard', 'Add chopped chili', 'Freeze in an ice-cube tray', 'Grated on a Microplane'],
    tips: [
      'Garlic in oil has to stay in the fridge and be used within 4 days. For longer, freeze it in an ice-cube tray and pop out a cube per dish.',
      'About 1 tablespoon of the mix is one dish for two people.',
    ] },

  { id: 'friedrice', n: 'Egg fried rice', kind: 'dish', r: 0, needs: ['rice', 'aromatics'], scale: true, time: 15, yields: '2 servings',
    why: 'Your first reuse: yesterday’s rice plus the flavor base. Cold rice fries better than fresh.',
    ing: [[3, 'cup', 'cold cooked rice from your batch'], [2, '', 'eggs, beaten with a pinch of salt'], [1, 'Tbsp', 'garlic-ginger prep'], [2, '', 'scallions, whites and greens apart'], [1, 'Tbsp', 'soy sauce'], [1, 'tsp', 'toasted sesame oil'], [2, 'Tbsp', 'neutral oil'], [null, '', 'white or black pepper']],
    steps: [
      'Break up the cold rice with damp hands so there are no clumps.',
      'Heat 1 Tbsp oil in your biggest skillet over high heat until it shimmers.',
      'Pour in the eggs, stir gently until just set and still soft, and slide them onto a plate.',
      'Add the rest of the oil, then the garlic-ginger prep and scallion whites. Stir for 20 seconds.',
      'Add the rice, spread it flat, and let it sit for a minute so it toasts. Toss and repeat for 3–4 minutes, until every grain is hot and some pop.',
      'Pour the soy sauce around the edge of the pan, not on the rice, so it sizzles. Add the eggs back, the scallion greens, sesame oil and pepper. Toss and serve.',
    ],
    twists: ['Standard', 'Peas and carrots', 'Kimchi', 'Chili crisp', 'Pineapple and ham'],
    tips: ['Reheated rice should be steaming hot all the way through.', 'Crowding the pan steams the rice. For 4 servings, cook in two batches.'] },

  // ---------- Round 2 ----------
  { id: 'teriyaki', n: 'Teriyaki sauce', kind: 'cap', r: 1, keep: 14, scale: true, time: 10, yields: 'About 1 cup',
    why: 'Glazes salmon, seasons rice bowls and drizzles over sushi bake.',
    ing: [[0.5, 'cup', 'soy sauce'], [0.5, 'cup', 'mirin'], [2, 'Tbsp', 'sake or water'], [2, 'Tbsp', 'sugar']],
    steps: [
      'Put everything in a small saucepan over medium heat and stir until the sugar dissolves.',
      { x: 'Simmer gently until it coats a spoon lightly, about 5 minutes. It thickens more as it cools.', t: 5, tl: 'Teriyaki simmer' },
      'Cool and pour into a jar. Keep it in the fridge.',
    ],
    twists: ['Standard', 'Thicker, eel-sauce style', 'With grated ginger', 'Honey instead of sugar'],
    tips: ['For a glossy glaze in a hurry, stir 1 tsp cornstarch into 1 Tbsp water and simmer it into a cup of sauce for 30 seconds.'] },

  { id: 'salmon', n: 'Salmon for the week', kind: 'cap', r: 1, keep: 3, scale: true, time: 20, yields: '4 portions, or flakes for 3–4 dishes',
    why: 'Cook one tray. Eat a fillet tonight and flake the rest into bowls, fried rice, onigiri and sushi.',
    ing: [[1.5, 'lb', 'salmon fillet, cut in 4 pieces'], [1, 'Tbsp', 'oil'], [1, 'tsp', 'salt'], [null, '', 'pepper'], [null, '', 'teriyaki sauce for brushing (optional)']],
    steps: [
      'Heat the oven to 400°F. Line a tray with foil or parchment.',
      'Pat the salmon dry. Rub with oil, salt and pepper and lay it skin side down.',
      { x: 'Roast 12–15 minutes for 1-inch-thick fillets, until the flesh is opaque and flakes with a fork.', t: 12, tl: 'Salmon in the oven' },
      'Check the thickest part. The FDA target for fish is 145°F.',
      'Eat what you want now. Cool the rest, take off the skin, flake it into a container and refrigerate within 2 hours.',
    ],
    twists: ['Oven-roasted', 'Pan-seared, skin on', 'Air fryer, 400°F about 9 min', 'Teriyaki glaze under the broiler', 'Miso glaze'],
    tips: [
      'Cooked fish keeps 3–4 days in the fridge.',
      'Save the skin: crisped in a dry pan, it makes a salmon-skin roll in round 4.',
      'Many cooks stop salmon at 125–130°F for a silkier texture. The FDA guideline is 145°F.',
    ],
    src: [SRC.fdaSea] },

  { id: 'eggs', n: 'Instant Pot jammy eggs', kind: 'cap', r: 1, keep: 3, scale: false, time: 15, yields: '1–12 eggs',
    why: 'A second Instant Pot skill, and protein for any bowl in the time it takes to make coffee.',
    ing: [[6, '', 'eggs'], [1, 'cup', 'water (1½ cups in an 8-quart pot)'], [null, '', 'a bowl of ice water']],
    steps: [
      'Pour the water into the inner pot, set the trivet in, and lay the eggs on it in one layer.',
      'Close the lid and turn the valve to Sealing.',
      { x: 'Pressure Cook, High, 3 minutes for jammy yolks.', t: 3, tl: 'Eggs at pressure' },
      'Quick release right away: turn the valve to Venting (keep your hand clear of the steam).',
      { x: 'Lift the eggs into the ice water with tongs and leave them 5 minutes.', t: 5, tl: 'Ice bath' },
      'Peel now or keep them in the shell in the fridge.',
    ],
    twists: ['Jammy, 3 min', 'Runny, 2 min', 'Hard: 5 min, 5 min natural release, 5 min ice', 'Soy-marinated (ramen eggs)'],
    tips: [
      'Peeled, they keep about 3 days. In the shell, up to a week.',
      'Ramen eggs: peel, then soak overnight in ¼ cup soy, ¼ cup mirin and ½ cup water.',
      'Timing varies a little by pot size. If the whites are loose, add a minute next time.',
    ],
    src: [SRC.eggs] },

  { id: 'salmonbowl', n: 'Teriyaki salmon rice bowl', kind: 'dish', r: 1, needs: ['rice', 'salmon', 'teriyaki'], opt: ['eggs', 'cuke', 'spicymayo'], scale: true, time: 10, yields: '1 bowl',
    why: 'Three capsules, five minutes. This is the payoff for cooking ahead.',
    ing: [[1.25, 'cup', 'cooked rice, reheated'], [1, '', 'portion of salmon, or ¾ cup flakes'], [2, 'Tbsp', 'teriyaki sauce'], [1, '', 'jammy egg (optional)'], [null, '', 'cucumber, avocado, scallion greens, sesame seeds']],
    steps: [
      'Reheat the rice covered with a splash of water until it steams.',
      'Warm the salmon gently: 30–60 seconds in the microwave, or a minute in a pan with a spoonful of teriyaki.',
      'Rice in the bowl, salmon on top, drizzle of teriyaki. Add a halved egg and whatever vegetables you have.',
    ],
    twists: ['Standard', 'With pickled cucumber', 'Spicy mayo drizzle', 'Furikake and nori strips', 'Over brown rice'] },

  // ---------- Round 3 ----------
  { id: 'stirsauce', n: 'All-purpose stir-fry sauce', kind: 'cap', r: 2, keep: 7, scale: true, time: 5, yields: 'About 1 cup, 4–5 stir-fries',
    why: 'Shake, pour, done. The jar is the difference between a stir-fry and a pan of vegetables.',
    ing: [[0.5, 'cup', 'soy sauce'], [0.25, 'cup', 'oyster sauce'], [0.25, 'cup', 'water or stock'], [2, 'Tbsp', 'Shaoxing wine or dry sherry (optional)'], [2, 'Tbsp', 'brown sugar'], [1, 'Tbsp', 'toasted sesame oil'], [2, 'Tbsp', 'cornstarch']],
    steps: [
      'Put everything in a jar, close it, and shake until the cornstarch disappears.',
      'Label it and keep it in the fridge.',
      'Use about ¼ cup per 2 servings. Shake it every time; the cornstarch settles.',
    ],
    twists: ['Standard', 'Spicy, with chili garlic sauce', 'Black bean', 'Sweet and sour, with rice vinegar and ketchup'],
    tips: ['Garlic and ginger go in the pan fresh, not in the jar. The jar keeps longer and the aromatics taste brighter.'] },

  { id: 'vegkit', n: 'Stir-fry vegetable kit', kind: 'cap', r: 2, keep: 4, scale: true, time: 20, yields: '3–4 stir-fries',
    why: 'Knife work done in one session, so a weeknight stir-fry is only cooking.',
    ing: [[1, '', 'head of broccoli, in small florets'], [2, '', 'bell peppers, in strips'], [1, '', 'onion, in thick wedges'], [2, '', 'carrots, sliced thin on an angle'], [8, 'oz', 'snap peas or green beans']],
    steps: [
      'Wash and dry everything well. Wet vegetables steam instead of searing.',
      'Cut by how long things take to cook: hard vegetables (carrot, broccoli stems) thin, soft ones (peppers, onion) thicker.',
      'Store hard and soft vegetables in two containers lined with a paper towel. Hard ones go in the pan first.',
    ],
    twists: ['Standard', 'Mushrooms and bok choy', 'Cabbage and carrot', 'Zucchini and corn'] },

  { id: 'stirfry', n: 'Stir-fry with rice', kind: 'dish', r: 2, needs: ['stirsauce', 'vegkit', 'aromatics', 'rice'], scale: true, time: 15, yields: '2 servings',
    why: 'Four capsules meet. Once this works, every protein and vegetable is just a twist.',
    ing: [[0.75, 'lb', 'protein: chicken thigh, shrimp, firm tofu or flank steak'], [1, 'tsp', 'cornstarch + 1 tsp soy sauce for the protein'], [3, 'cup', 'vegetables from the kit'], [1, 'Tbsp', 'garlic-ginger prep'], [0.25, 'cup', 'stir-fry sauce, shaken'], [2, 'Tbsp', 'neutral oil'], [2, 'cup', 'rice, reheated']],
    steps: [
      'Pat the protein dry, slice it thin, and toss it with the cornstarch and soy. This light coating keeps it tender.',
      'Heat 1 Tbsp oil in a wok or big skillet over high heat until it just smokes.',
      'Sear the protein in one layer, without stirring, for 1 minute. Stir until just cooked and move it to a plate.',
      'Add the rest of the oil and the hard vegetables with a splash of water. Stir-fry 2 minutes, then add the soft ones for 1–2 minutes more.',
      'Push everything aside, add the garlic-ginger prep to the hot spot for 20 seconds, then stir it in.',
      'Put the protein back, pour in the sauce, and toss 30–60 seconds until glossy. Serve over rice.',
    ],
    twists: ['Chicken thigh', 'Shrimp', 'Tofu', 'Flank steak', 'Salmon cubes, folded in at the end', 'Noodles instead of rice'],
    tips: ['Chicken is done at 165°F. Shrimp is done when it turns pink and curls into a C.', 'For more than 2 servings, sear the protein in batches.'] },

  { id: 'salmonfried', n: 'Salmon fried rice', kind: 'dish', r: 2, needs: ['rice', 'salmon', 'aromatics'], opt: ['eggs', 'vegkit'], scale: true, time: 15, yields: '2 servings',
    why: 'Egg fried rice, plus your salmon flakes. The best use of day-three leftovers.',
    ing: [[3, 'cup', 'cold cooked rice'], [1, 'cup', 'salmon flakes'], [2, '', 'eggs'], [1, 'Tbsp', 'garlic-ginger prep'], [1, 'cup', 'vegetables from the kit, chopped small (optional)'], [1, 'Tbsp', 'soy sauce'], [2, 'Tbsp', 'neutral oil'], [null, '', 'scallion greens, sesame oil']],
    steps: [
      'Make egg fried rice exactly as before, adding the small-cut vegetables with the aromatics.',
      'In the last minute, fold the salmon flakes in gently so they stay in pieces. Heat until steaming.',
      'Finish with scallion greens and a few drops of sesame oil.',
    ],
    twists: ['Standard', 'With kimchi', 'Teriyaki drizzle', 'Topped with a jammy egg'] },

  // ---------- Round 4 ----------
  { id: 'sushivin', n: 'Sushi vinegar jar', kind: 'cap', r: 3, keep: 90, scale: true, time: 5, yields: 'About 1¼ cups, seasons 8 cups of dry rice',
    why: 'Make it once and sushi rice is only rice plus a pour.',
    ing: [[1, 'cup', 'unseasoned rice vinegar'], [0.5, 'cup', 'sugar'], [8, 'tsp', 'salt (2 Tbsp + 2 tsp)']],
    steps: [
      'Warm everything in a small pan, or microwave it in short bursts, stirring until the sugar and salt dissolve. Do not boil.',
      'Cool and pour into a bottle. Label it.',
      'Use 2 Tbsp for each cup of dry rice you cook.',
    ],
    twists: ['Standard', 'With a piece of kombu', 'Less sweet (⅓ cup sugar)'],
    tips: ['The ratio is 6 : 3 : 1 vinegar to sugar to salt. It keeps for months in the fridge.'],
    src: [SRC.ipShort] },

  { id: 'sushirice', n: 'Sushi rice', kind: 'cap', r: 3, needs: ['sushivin'], keep: 1, keepTxt: 'Use today', scale: true, time: 40, yields: 'About 4 cups, 4 rolls',
    why: 'Short-grain rice, cooked a little firmer and seasoned while hot. The heart of every sushi.',
    ing: [[2, 'cup', 'short-grain or Calrose rice'], [2, 'cup', 'cold water'], [4, 'Tbsp', 'sushi vinegar']],
    steps: [
      'Rinse the rice gently until the water runs clear, about 5 changes. Drain it in a strainer for 5–10 minutes.',
      'Add the rice and water to the pot. Close the lid and turn the valve to Sealing.',
      { x: 'Pressure Cook, High, 5 minutes.', t: 5, tl: 'Sushi rice at pressure' },
      { x: 'Natural release for 10 minutes, then vent the rest.', t: 10, tl: 'Natural release' },
      'Turn the hot rice into a wide bowl, ideally wood or glass. Pour the sushi vinegar over a spatula so it spreads.',
      'Fold with slicing strokes. Do not stir or mash. Fan it while you fold so it turns glossy.',
      { x: 'Cover with a damp towel and let it cool to body temperature, about 20–30 minutes.', t: 20, tl: 'Rice cooling' },
    ],
    twists: ['Calrose, 5 min', 'Japanese short-grain, 5 min', 'Cooked with kombu'],
    tips: [
      'Sushi rice is best the day you make it. The fridge turns it hard.',
      'Leftovers go in the fridge within 2 hours, then become sushi bake or fried rice.',
      'For onigiri, cook the same rice and skip the vinegar.',
    ],
    src: [SRC.ipShort, SRC.rice] },

  { id: 'cuke', n: 'Quick cucumber pickle', kind: 'cap', r: 3, keep: 3, scale: true, time: 15, yields: 'About 1½ cups',
    why: 'Crunch and acid for bowls and rolls.',
    ing: [[1, '', 'English cucumber'], [0.5, 'tsp', 'salt'], [3, 'Tbsp', 'rice vinegar'], [1, 'Tbsp', 'sugar'], [1, 'tsp', 'sesame seeds']],
    steps: [
      'Slice the cucumber paper-thin, or cut half of it into long matchsticks for rolls.',
      { x: 'Toss the slices with the salt and leave them 10 minutes.', t: 10, tl: 'Cucumber salting' },
      'Squeeze out the water by the handful.',
      'Stir the vinegar and sugar together, toss with the cucumber, add the sesame. Fridge it.',
    ],
    twists: ['Thin slices', 'Matchsticks for rolls', 'With wakame seaweed', 'With chili flakes'] },

  { id: 'spicymayo', n: 'Spicy mayo', kind: 'cap', r: 3, keep: 7, scale: true, time: 2, yields: 'About ⅓ cup',
    why: 'Thirty seconds of work that turns cooked salmon into sushi filling.',
    ing: [[0.25, 'cup', 'mayonnaise (Kewpie if you find it)'], [1.5, 'Tbsp', 'sriracha'], [1, 'tsp', 'rice vinegar or lime juice'], [0.5, 'tsp', 'toasted sesame oil']],
    steps: ['Stir everything together. Taste and add more sriracha if you like.', 'Spoon into a small squeeze bottle or jar and keep it in the fridge.'],
    twists: ['Standard', 'Extra hot', 'With gochujang', 'Wasabi mayo'] },

  { id: 'sushibake', n: 'Salmon sushi bake', kind: 'dish', r: 3, needs: ['sushirice', 'salmon', 'spicymayo'], opt: ['teriyaki', 'cuke'], scale: true, time: 25, yields: '3–4 servings, 8×8 dish',
    why: 'The easiest sushi there is: no rolling, all the flavor. Scoop it onto nori with your hands.',
    ing: [[3, 'cup', 'sushi rice'], [2, 'cup', 'salmon flakes'], [3, 'Tbsp', 'spicy mayo, plus more on top'], [2, 'oz', 'cream cheese, soft (optional)'], [2, 'Tbsp', 'furikake'], [null, '', 'teriyaki, scallion greens, roasted nori snack sheets']],
    steps: [
      'Heat the oven to 400°F.',
      'Press the sushi rice evenly into an 8×8 dish. Sprinkle half the furikake over it.',
      'Mix the salmon flakes with the spicy mayo and cream cheese. Spread it over the rice and top with the rest of the furikake.',
      { x: 'Bake 10–12 minutes until hot, then broil 1–2 minutes to brown the top. Watch it.', t: 10, tl: 'Sushi bake' },
      'Drizzle with spicy mayo and teriyaki, add scallions, and serve with nori squares for scooping.',
    ],
    twists: ['Standard', 'Add imitation crab', 'Avocado on top', 'With cucumber pickle on the side'],
    tips: ['Day-old sushi rice works here. The oven brings it back.'] },

  { id: 'onigiri', n: 'Salmon onigiri', kind: 'dish', r: 3, needs: ['rice', 'salmon'], opt: ['teriyaki'], scale: true, time: 15, yields: '4 rice balls',
    why: 'Japan’s lunchbox staple, and the training ground for handling sticky rice.',
    ing: [[2, 'cup', 'freshly cooked short-grain rice, unseasoned'], [0.5, 'cup', 'salmon flakes'], [1, 'tsp', 'soy sauce or teriyaki'], [null, '', 'salt for your hands'], [2, '', 'nori sheets, cut in strips']],
    steps: [
      'Cook short-grain rice with the rice capsule (twist: short-grain, 5 min). It must be warm; cold rice will not hold together.',
      'Mix the salmon flakes with the soy or teriyaki.',
      'Wet your hands, rub a pinch of salt over your palms, and take about ½ cup of rice.',
      'Flatten it, put a spoonful of salmon in the middle, and close the rice over it.',
      'Press into a triangle with cupped hands, turning it 3 or 4 times. Firm, not crushed.',
      'Wrap a nori strip around the bottom just before eating so it stays crisp.',
    ],
    twists: ['Classic triangle', 'Salmon mixed through the rice', 'Grilled (yaki onigiri) with teriyaki', 'With sesame and scallion'] },

  { id: 'maki', n: 'Cooked salmon roll', kind: 'dish', r: 3, needs: ['sushirice', 'salmon'], opt: ['cuke', 'spicymayo'], scale: true, time: 30, yields: '4 rolls, 32 pieces',
    why: 'Real rolled sushi, made with salmon you cooked. The technique carries straight into raw sushi later.',
    ing: [[4, '', 'nori sheets'], [3, 'cup', 'sushi rice'], [1, 'cup', 'salmon flakes, mixed with a little spicy mayo'], [1, 'cup', 'cucumber matchsticks'], [1, '', 'avocado, sliced (optional)'], [null, '', 'soy sauce, pickled ginger, wasabi'], [null, '', 'a bowl of water with a splash of vinegar (tezu)']],
    steps: [
      'Wrap the bamboo mat in plastic wrap. Set out the nori, rice, fillings and the bowl of vinegar water.',
      'Lay a nori sheet shiny side down on the mat, long edge toward you.',
      'Wet your hands. Spread ¾ cup of rice evenly over the nori, leaving 1 inch bare at the far edge. Do not press hard.',
      'Lay a line of salmon, cucumber and avocado across the rice, a third of the way up.',
      'Lift the mat edge with your thumbs, hold the filling with your fingers, and roll forward until the edge meets the rice on the other side. Squeeze gently along the mat.',
      'Keep rolling to seal the bare edge, which sticks with a dab of water.',
      'Wet a sharp knife, cut the roll in half, then each half in half and in half again. Wipe the knife between cuts.',
    ],
    twists: ['Classic roll, nori outside', 'Inside-out roll, sesame outside', 'Smoked salmon and cream cheese', 'Crispy salmon skin roll', 'Hand roll (temaki)'],
    tips: [
      'For an inside-out roll, spread rice over the whole sheet, sprinkle with sesame, flip it onto the wrapped mat, then fill and roll.',
      'Store-bought smoked salmon is sold ready to eat, but it is uncooked fish. Skip it if you are pregnant or immunocompromised.',
      'Overfilling is the most common reason a roll will not close. Less is more.',
    ] },

  // ---------- Round 5 ----------
  { id: 'rawsalmon', n: 'Buy salmon for raw sushi', kind: 'cap', r: 4, keep: 1, keepTxt: 'Eat it today', scale: false, time: 30, yields: 'Plan ¼ lb per person',
    why: '“Sushi grade” is a store label, not a government grade. What makes salmon safe to eat raw is how it was raised or frozen, and how fresh it is.',
    ing: [[null, '', 'Salmon sold for raw use: farmed on pellet feed, or previously frozen to FDA parasite standards'], [null, '', 'A cooler bag with ice or ice packs']],
    steps: [
      'Know the rule: the FDA says to freeze fish for raw eating at –4°F or colder for 7 days, or colder still for less time. Farmed salmon raised on pellet feed is exempt under the Food Code.',
      'Home freezers run around 0°F, which is not cold enough, so home freezing is not a reliable fix. Buy it already handled.',
      'Ask at the counter: “Is this sold for raw use? Is it farmed, or was it previously frozen?” If the label says “cook before eating,” cook it.',
      'Look for firm, glossy flesh that smells like the sea, not fishy. Keep it on ice and go straight home.',
      'Near Charlotte, home cooks buy at Clean Catch Fish Market (Selwyn Ave), Lucky Fish (Yorkmont Rd, open Friday–Sunday), Hatoya Japanese market (Pineville) and Super G Mart. Call ahead.',
      'Keep it in the coldest part of the fridge and eat it the same day. If it was frozen, thaw it overnight in the fridge.',
    ],
    twists: ['Fresh, farmed', 'Previously frozen, thawed in the fridge', 'Ordered online, frozen'],
    tips: [
      'Freezing kills parasites, not bacteria, so clean boards, knives and hands matter as much as the fish.',
      'The FDA says people who are pregnant, older, very young or immunocompromised should not eat raw fish.',
    ],
    src: [SRC.fdaPar, SRC.vdh, SRC.fdaAZ, SRC.fdaSea] },

  { id: 'poke', n: 'Salmon poke bowl', kind: 'dish', r: 4, needs: ['rawsalmon', 'rice'], opt: ['sushirice', 'cuke', 'spicymayo'], scale: true, time: 15, yields: '2 bowls',
    why: 'The gentlest first step with raw fish: no slicing skill needed, all your capsules on the side.',
    ing: [[0.5, 'lb', 'raw-ready salmon, very cold'], [1.5, 'Tbsp', 'soy sauce'], [1, 'tsp', 'toasted sesame oil'], [1, 'tsp', 'rice vinegar'], [2, '', 'scallions, sliced'], [2.5, 'cup', 'rice or sushi rice'], [null, '', 'cucumber pickle, avocado, spicy mayo, sesame, nori strips']],
    steps: [
      'Use a clean board and knife. Cut the salmon into ¾-inch cubes, keeping it cold.',
      'Toss with the soy, sesame oil, vinegar and scallions.',
      'Spoon the rice into bowls, top with the salmon and your sides, and eat right away.',
    ],
    twists: ['Shoyu', 'Spicy, with spicy mayo', 'With mango', 'Over sushi rice'] },

  { id: 'nigiri', n: 'Salmon nigiri and sashimi', kind: 'dish', r: 4, needs: ['rawsalmon', 'sushirice'], scale: true, time: 25, yields: 'About 16 pieces',
    why: 'The finish line: just rice, salmon and your hands.',
    ing: [[0.5, 'lb', 'raw-ready salmon block, skin off'], [2, 'cup', 'sushi rice'], [null, '', 'wasabi, soy sauce, pickled ginger'], [null, '', 'bowl of vinegar water (tezu)']],
    steps: [
      'Chill the salmon well. Use your sharpest, longest knife and wet it.',
      'Slice across the grain at a slight angle, about ¼ inch thick, in one long pulling stroke. Do not saw.',
      'Wet your hands and shape about 2 Tbsp of rice into a small oblong, gently. It should hold together but not be dense.',
      'Dab a little wasabi on a salmon slice, lay the rice on it, and press the two together with two fingers.',
      'Thicker slices on their own, without rice, are sashimi.',
    ],
    twists: ['Nigiri', 'Sashimi', 'Seared (aburi) with a torch', 'With a thin slice of lemon'] },
];

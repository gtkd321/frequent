// Frequent Studio reads. © 2026 Daniel Ilias Houlis. All rights reserved.
// Original practice texts unless marked "Public domain". Each paragraph carries one intention:
// explain, contrast, warn, list, conclude or scene. The intention shapes emphasis; no big emotion needed.
'use strict';
const GENRES = { nonfiction: 'Nonfiction', technical: 'Technical', instructional: 'Instructional', documentary: 'Documentary', elearning: 'Course & corporate', narrative: 'Calm narrative' };
const INTENTS = {
  explain: ['Explain', 'Hand the listener one new idea. Land the key noun; let the rest support it.'],
  contrast: ['Contrast', 'Two things side by side. Lean lightly on the second one, the turn.'],
  warn: ['Warn', 'Slow down a touch. Clear consonants. The listener should not miss this.'],
  list: ['List', 'Same shape for every item, small lift between them, and a fall on the last.'],
  conclude: ['Conclude', 'Settle. Lower and slower on the final sentence, then let the room tone breathe.'],
  scene: ['Scene', 'Place the listener somewhere. Concrete words carry it; you only need steady pace.']
};
const READS = [
  { id: 'bench', g: 'nonfiction', bench: true, t: 'The Weight of One Olive', src: 'Weekly benchmark. Same read every week, so you can hear the change.', p: [
    ['explain', 'A single olive weighs about four grams. It takes roughly five kilograms of olives, picked by hand or shaken from the branches, to press one liter of oil. That ratio, more than any marketing, explains the price on the bottle.'],
    ['contrast', 'Big producers blend oil from several countries and bottle it under one brand. Small producers press a single harvest from a single grove, and the flavor changes from year to year. Neither is wrong, but only one can tell you exactly where it came from.'],
    ['list', 'Taste for three things: fruit, bitterness and pepper. Fruit is the smell of fresh green leaves or ripe tomato. Bitterness sits on the back of the tongue. Pepper is the catch in the throat that makes some tasters cough.'],
    ['conclude', 'That cough is not a flaw. It is the polyphenols, and in good oil it is the point.']
  ] },
  { id: 'walden', g: 'nonfiction', t: 'Walden, opening', src: 'Henry David Thoreau, 1854. Public domain.', p: [
    ['scene', 'When I wrote the following pages, or rather the bulk of them, I lived alone, in the woods, a mile from any neighbor, in a house which I had built myself, on the shore of Walden Pond, in Concord, Massachusetts, and earned my living by the labor of my hands only.'],
    ['conclude', 'I lived there two years and two months. At present I am a sojourner in civilized life again.']
  ] },
  { id: 'darwin', g: 'documentary', t: 'The entangled bank', src: 'Charles Darwin, On the Origin of Species, 1859. Public domain.', p: [
    ['scene', 'It is interesting to contemplate an entangled bank, clothed with many plants of many kinds, with birds singing on the bushes, with various insects flitting about, and with worms crawling through the damp earth,'],
    ['conclude', 'and to reflect that these elaborately constructed forms, so different from each other, and dependent on each other in so complex a manner, have all been produced by laws acting around us.']
  ] },
  { id: 'router', g: 'technical', t: 'Resetting the network router', src: 'Original practice text.', p: [
    ['explain', 'The reset button sits in a small recess on the back panel, between the power port and the first Ethernet port. You will need a straightened paper clip or a SIM tool to reach it.'],
    ['warn', 'A reset erases every custom setting, including your network name and password. Write them down before you begin. Do not unplug the router while the status light is flashing amber.'],
    ['list', 'Press and hold the button for ten seconds. Release it when the light turns solid amber. Wait about two minutes. The light will turn solid white when the router is ready.'],
    ['conclude', 'You can now connect using the default name and password printed on the label underneath the router.']
  ] },
  { id: 'pump', g: 'technical', t: 'Priming a well pump', src: 'Original practice text.', p: [
    ['warn', 'Switch off power to the pump at the breaker before removing the priming plug. Confirm it is off with a non-contact voltage tester.'],
    ['explain', 'A shallow-well jet pump cannot lift water it has not already been given. Priming fills the pump casing and the suction line, so the impeller has water to push against.'],
    ['list', 'Remove the priming plug. Pour clean water into the port until it overflows. Replace the plug hand-tight, then a quarter turn with a wrench. Restore power and watch the pressure gauge.'],
    ['conclude', 'If the pressure does not rise within two minutes, switch the power off and prime again. Two or three rounds are normal after a long dry spell.']
  ] },
  { id: 'dough', g: 'instructional', t: 'A first loaf with olive oil', src: 'Original practice text.', p: [
    ['list', 'You will need five hundred grams of bread flour, three hundred and fifty grams of warm water, ten grams of salt, seven grams of instant yeast and two tablespoons of extra virgin olive oil.'],
    ['explain', 'Mix everything until no dry flour remains, then rest the dough for twenty minutes. This pause lets the flour absorb the water, so the kneading that follows is shorter and easier.'],
    ['contrast', 'A dough that tears when you stretch it needs more time, not more flour. A dough that stretches thin enough to let light through is ready.'],
    ['conclude', 'Cover it, let it double, and bake at two hundred and thirty degrees Celsius for about forty minutes.']
  ] },
  { id: 'breath', g: 'instructional', t: 'Box breathing, guided', src: 'Original practice text. Read slowly; leave real silence where the text pauses.', p: [
    ['explain', 'This exercise takes about two minutes. You can do it sitting or standing, with your eyes open or closed.'],
    ['list', 'Breathe in through your nose for a count of four. Hold for four. Breathe out through your mouth for four. Hold again for four.'],
    ['scene', 'Notice the air is cool on the way in and warm on the way out. Notice where your shoulders are. Let them drop a little.'],
    ['conclude', 'Repeat the square four more times at your own pace. When you are ready, return to your normal breathing.']
  ] },
  { id: 'museum', g: 'documentary', t: 'Gallery three: the harvest presses', src: 'Original practice text, museum audio guide style.', p: [
    ['scene', 'In front of you stands a stone olive press from the island of Lesvos, built in the late nineteenth century. The lower basin is a single block of granite, almost two meters across.'],
    ['explain', 'A mule walked in a circle, turning the upright millstone that crushed the fruit into paste. The paste was then spread onto woven mats, stacked, and squeezed in the screw press to your left.'],
    ['contrast', 'A family of six could press their whole harvest here in about a week. A modern mill processes the same amount in an afternoon.'],
    ['conclude', 'When you are ready, continue to gallery four, where the mats themselves are on display.']
  ] },
  { id: 'safety', g: 'elearning', t: 'Module 2: reporting a near miss', src: 'Original practice text, compliance training style.', p: [
    ['explain', 'A near miss is any event that could have caused injury or damage, but did not. A ladder that slips and is caught. A forklift that stops inches from a pallet.'],
    ['contrast', 'An accident report tells us what went wrong. A near-miss report tells us what is about to go wrong, while there is still time to fix it.'],
    ['list', 'To report one, open the safety portal, choose Near Miss, describe what happened in one or two sentences, and add a photo if it is safe to take one.'],
    ['warn', 'Reports are never used to discipline the person who files them. If anyone suggests otherwise, contact the safety office directly.'],
    ['conclude', 'In the next module, we will look at how these reports become changes on the floor.']
  ] },
  { id: 'onboard', g: 'elearning', t: 'Welcome to the team', src: 'Original practice text, corporate onboarding style.', p: [
    ['explain', 'Over the next twelve minutes, you will learn how our support team turns a customer question into a solved case, and where you fit in that process.'],
    ['list', 'Every case moves through four stages: received, understood, resolved and confirmed. Most of your work happens in the second stage.'],
    ['contrast', 'Fast answers matter. Correct answers matter more. A case reopened tomorrow costs us twice the time of one solved carefully today.'],
    ['conclude', 'Let us start with stage one.']
  ] },
  { id: 'harbor', g: 'narrative', t: 'Morning at the harbor', src: 'Original practice text. Calm fiction; no character voices.', p: [
    ['scene', 'The ferry came in at six, an hour before the cafés opened. Nikos stood at the end of the quay with his hands in his jacket pockets and watched the ropes go out.'],
    ['scene', 'Three passengers came down the ramp: a priest with a cardboard box, a woman carrying a sleeping child, and a young man who looked at every building as if he were checking it against a photograph.'],
    ['contrast', 'The priest and the woman walked straight up the hill. The young man stopped, set down his bag and stayed exactly where he was.'],
    ['conclude', 'Nikos had seen that look before. It was the look of someone who had come home and had not yet decided whether to admit it.']
  ] },
  { id: 'grove', g: 'narrative', t: 'The grove in November', src: 'Original practice text. Calm fiction; no character voices.', p: [
    ['scene', 'By the second week of November the nets were spread under every tree, green over the red earth, and the whole hillside smelled of crushed leaves.'],
    ['scene', 'Her grandfather worked one side of the trunk and she worked the other, combing the branches with a short plastic rake. The olives dropped with a sound like slow rain.'],
    ['conclude', 'They did not talk much. At noon he poured a little oil from last year onto a slice of bread, salted it, and handed it to her without a word.']
  ] },
  { id: 'sleep', g: 'nonfiction', t: 'Why we sleep in cycles', src: 'Original practice text, popular-science style.', p: [
    ['explain', 'A night of sleep is not one long stretch of rest. It is a series of cycles, each lasting roughly ninety minutes, that repeat four to six times before morning.'],
    ['contrast', 'Early cycles are dominated by deep, slow-wave sleep, when the body repairs tissue. Later cycles carry more rapid eye movement sleep, when most vivid dreaming happens.'],
    ['warn', 'That is why cutting the last two hours of a night costs more than it seems. You are not losing a quarter of your sleep. You are losing most of a particular kind of it.'],
    ['conclude', 'The cycles, not the hours, are what the body is counting.']
  ] },
  { id: 'greek', g: 'instructional', t: 'Your first Greek sounds', src: 'Original practice text, language-course style. Real Greek words; check the stress marks.', p: [
    ['explain', 'Greek spelling is more regular than English. Once you know how a letter combination sounds, it almost always sounds that way.'],
    ['list', 'Kalimera means good morning. Efcharistó means thank you. Parakaló means please, and also you are welcome.'],
    ['warn', 'Stress matters. Every word of more than one syllable carries a small accent mark, and moving the stress can change the meaning entirely.'],
    ['conclude', 'Say each word three times, slowly, and listen for where your voice lands.']
  ] }
];

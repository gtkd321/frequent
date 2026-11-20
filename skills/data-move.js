/* Mobility drawings, routines, return-to-run plan, treat menu */
window.MOVE={
note:'Tightness and soreness when running usually come from the calf, foot and hip not being strong enough for the load yet. Stretching alone does not prevent running injuries; strength work does. So most of this is slow strength, plus a few mobility moves.',
src:[['Strength cut sports injuries by about a third, stretching showed no effect (Lauersen 2014)','https://www.ncbi.nlm.nih.gov/books/NBK169555/'],['Strength training cut sports injuries by about 66% (Lauersen 2018)','https://bjsm.bmj.com/content/bjsports/52/24/1557.full.pdf'],['Foot-core exercises: runners who skipped them were 2.42x more likely to get injured (Taddei 2020)','https://pubmed.ncbi.nlm.nih.gov/33156692/'],['Hip plus knee strengthening for knee pain (JOSPT guideline)','https://www.jospt.org/doi/full/10.2519/jospt.2019.0302'],['Caveat: evidence specific to runners is still thin','https://pmc.ncbi.nlm.nih.gov/articles/PMC11127851/']],
ex:[
{id:'rock',area:'Ankle',name:'Knee-to-wall ankle rocks',dose:'10 per side, hold 2 s at the end',cue:'Front foot about a hand from the wall. Heel stays down; drive the knee forward over the middle toes until it touches the wall. Move the foot back as it gets easier.',test:'Test: measure the farthest toe-to-wall distance where the knee still touches with the heel down. Around 9 to 10 cm is a common benchmark; compare sides.',
 fig:'W 140|F|L 104,110 124,110|L 108,107 130,82 100,74 80,108 56,109|L 100,74 102,42|C 103,33|L 102,46 122,52 139,50|T 108,106|A 120,72 132,62 138,76'},
{id:'circle',area:'Ankle',name:'Ankle circles or alphabet',dose:'10 circles each way, or trace A to Z',cue:'Seated, leg out. Move only the foot, as big and slow as you can.',
 fig:'F|L 40,72 76,72|L 44,72 44,110|L 72,72 72,110|L 40,72 40,40|L 60,70 96,70 96,108 108,110|L 60,68 92,64 124,68 127,56|L 60,70 54,38|C 53,29|L 55,44 48,62 44,70|T 124,68|O 126,60 11'},
{id:'calf',area:'Calf',name:'Slow calf raises off a step',dose:'3 x 12, 3 s down. Build toward one leg',cue:'Balls of the feet on the edge, knee straight. Up in 1 s, lower in 3 s until the heel drops below the step.',
 fig:'R 50 100 74 10|F|W 30|L 86,94 100,100|L 88,92 88,70 88,46 88,18|C 88,10|L 88,22 60,34 31,34|T 88,80|A 72,106 70,94 72,80'},
{id:'soleus',area:'Calf',name:'Bent-knee calf raises (soleus)',dose:'3 x 15, slow',cue:'Knee bent, either seated with weight on the knee or standing in a small squat. This works the deep calf muscle that takes much of the running load.',
 fig:'F|L 40,72 76,72|L 44,72 44,110|L 72,72 72,110|L 40,72 40,40|L 60,70 96,70 96,100 110,110|L 60,70 54,38|C 53,29|L 55,44 80,58 94,66|R 86 60 16 7|T 98,90|A 84,108 80,100 86,92'},
{id:'short',area:'Foot',name:'Short foot (arch dome)',dose:'10 x 5 s hold, seated, then standing',cue:'Keep the toes long and relaxed. Pull the ball of the foot toward the heel so the arch lifts. No toe curling.',
 fig:'F|P M30,106 Q32,92 48,90 Q78,74 102,86 Q122,94 136,100 Q140,108 128,110 L40,110 Q30,110 30,106|L 50,90 46,8|L 64,84 62,8|P M60,110 Q82,94 104,110|T 82,100|A 122,84 104,76 88,82'},
{id:'toeyoga',area:'Toes',name:'Toe yoga',dose:'10 each way',cue:'Lift only the big toe while the small toes press down, then swap: big toe down, small toes up.',
 fig:'P M40,110 L40,66 Q40,44 64,42 L112,42 Q128,44 128,66 L128,110|F|E 54,22 9 11|E 76,44 6 7|E 92,46 5 6|E 106,48 5 6|E 118,52 4 5|T 54,22|A 34,40 30,26 38,14'},
{id:'toes',area:'Toes',name:'Kneeling toe stretch',dose:'30 to 60 s, 2 times',cue:'Kneel with toes tucked under and sit back toward the heels until you feel it in the soles and big toes. Hands on the floor to ease off.',
 fig:'F|L 110,108 72,106|L 74,110 68,92|L 70,88 110,106|L 70,88 74,56|C 75,47|L 74,62 94,80 104,96|T 74,108'},
{id:'stepdown',area:'Knee',name:'Slow step-downs',dose:'3 x 10 per side, 3 s down',cue:'Stand on a step, lower the other heel to tap the floor. Knee tracks over the middle toes, hips level.',
 fig:'R 56 82 50 28|F|L 78,82 98,82|L 84,80 98,58 76,44|L 76,44 108,64 114,98 124,100|L 76,44 86,14|C 88,5|L 85,18 108,26 120,22|T 98,58|A 134,80 138,90 130,102'},
{id:'split',area:'Knee',name:'Split squat',dose:'3 x 8 per side',cue:'Long stance. Drop the back knee straight down toward the floor, front heel stays heavy. Add dumbbells at the gym.',
 fig:'F|L 102,110 122,110|L 104,108 108,82 80,78 70,104 42,108|L 80,78 80,46|C 80,37|L 80,52 84,74|R 80 74 8 6|T 108,82|A 60,60 56,72 60,86'},
{id:'flexor',area:'Hip',name:'Half-kneeling hip flexor stretch',dose:'30 s x 2 per side',cue:'Back knee down. Squeeze the back-side glute and tuck the tailbone; you should feel the front of that hip open. Do not arch the low back.',
 fig:'F|L 104,110 120,110|L 108,108 106,84 80,82 70,108 42,110|L 80,82 82,48|C 82,39|L 82,54 94,66 84,78|T 76,96|A 62,74 74,66 88,72'},
{id:'ninety',area:'Hip',name:'90/90 hip switches',dose:'8 switches per side',cue:'Sit with both knees bent to 90 degrees, one leg in front, one to the side. Sit tall and rotate both knees to the other side. View from above.',
 fig:'L 70,58 100,58|C 85,52|L 88,62 88,94 120,94|L 82,62 52,62 52,30|T 85,62|A 120,82 136,60 120,38'},
{id:'bridge',area:'Hip',name:'Glute bridge',dose:'3 x 12, build to one leg',cue:'Feet flat, push through the heels and lift the hips until shoulders, hips and knees line up. Pause 2 s at the top.',
 fig:'F|C 28,102|L 38,106 84,82 112,80 118,108 130,110|L 42,108 72,110|T 84,82|A 84,106 80,98 84,90'},
{id:'clam',area:'Hip',name:'Clamshell or side-lying leg raise',dose:'3 x 15 per side',cue:'Lie on your side, knees bent, feet together. Lift the top knee without rolling the hips back. A band makes it harder.',
 fig:'F|C 28,92|L 36,98 26,102|L 38,96 84,96|L 84,100 108,86 132,102|L 84,96 102,70 132,100|T 84,96|A 112,80 114,68 104,62'},
{id:'swing',area:'Hip',name:'Leg swings',dose:'10 front-back, 10 side-side per leg',cue:'Hand on a wall, relaxed swings that grow bigger. Good right before a run.',
 fig:'W 30|F|L 70,110 80,110|L 70,110 70,58|L 70,58 70,26|C 70,16|L 70,30 50,42 31,42|L 70,58 98,92 106,90|G 70,58 50,98|A 52,106 76,118 102,102'}
],
routines:[
{id:'pre',name:'Before a run',time:'5 min',ids:['circle','swing','rock','calf'],why:'Dynamic moves to wake the ankle and hip. Save the long holds for later.'},
{id:'daily',name:'Daily mobility',time:'8 min',ids:['rock','toes','short','toeyoga','ninety','flexor'],why:'Range for the ankle, toes, foot and hip. Fine on any day, including rest days.'},
{id:'strong',name:'Run-ready strength',time:'15 min, 3x a week',ids:['calf','soleus','stepdown','split','bridge','clam'],why:'The part with the best evidence. Do it at the gym after your main lifts, three days a week.'}
],
run:[['Week 1','6 x (run 1 min, walk 2 min)'],['Week 2','6 x (run 2 min, walk 2 min)'],['Week 3','5 x (run 3 min, walk 2 min)'],['Week 4','4 x (run 5 min, walk 2 min)'],['Week 5','3 x (run 8 min, walk 2 min)'],['Week 6','2 x (run 12 min, walk 2 min)'],['Week 7','20 min easy run'],['Week 8','25 to 30 min easy run, about a 5K']],
runNote:'Three sessions a week with a day between. Start each with 5 minutes of brisk walking and the Before a run routine. Easy pace: you can talk in full sentences.',
pain:[['Green, 0 to 2','Keep going as planned.'],['Amber, 3 to 5','Acceptable if it settles by the next morning and is not building week to week.'],['Red, above 5, or worse next morning','Repeat or step back a week. Sharp pain, swelling, a limp or a pop means stop and see a physical therapist.']],
painSrc:['Pain-monitoring model, tested in Achilles and knee pain (Silbernagel 2007)','https://hibbertmed.com/patients/move-well/pain-during-exercise'],
disclaimer:'General guidance, not medical advice. If pain persists past two weeks or changes how you walk, see a physical therapist.'
};
window.TREATS={
during:['A playlist or podcast only for chores, driving or the gym','Good coffee or tea in a favorite mug, only at the desk','Work somewhere nicer: porch, café or a window'],
after:['One pre-picked YouTube video (laptop or TV)','Step outside and look at trees for a minute','Fruit, dark chocolate, or olives on bread with your own oil','One song, loud','Text a friend about the win'],
big:['A meal out','A new book','A film','Gear that compounds, like studio headphones','A day trip'],
every:7,
yt:['Pick the video before you start working.','One video, then stop. Autoplay off, no Shorts.','Watch it after the block, never in the middle of a hard task.','Laptop or TV; the phone stays out of reach.','Comedy or uplifting. Greek-language videos count double.'],
rule:'Do not put treats on things you already love (Greek, chant, writing). Expected rewards can crowd out the love; save treats for chores, admin and outreach.',
src:[['Immediate rewards keep people going (Woolley and Fishbach 2017)','https://journals.sagepub.com/doi/full/10.1177/0146167216676480'],['Self-rewards work best with an if-then plan and actually taking the reward','https://research.manchester.ac.uk/en/studentTheses/the-role-of-self-rewards-in-behaviour-change/'],['Expected rewards can undermine intrinsic motivation (Deci, Koestner and Ryan 1999)','https://selfdeterminationtheory.org/SDT/documents/1999_DeciKoestnerRyan_Meta.pdf'],['A funny video restored persistence (Tice 2007)','https://www.sciencedirect.com/science/article/abs/pii/S0022103106000862'],['Phone breaks left people slower and solving fewer problems','https://www.sciencedaily.com/releases/2019/08/190819132130.htm'],['A 40-second green view sharpened attention','https://www.sciencedaily.com/releases/2015/05/150526093611.htm']]
};

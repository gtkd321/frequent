/* Workshop (manual labor, woodworking, studio build) and Unstuck (the Nothing, Name it, The Quiet, three good things) */
window.BRANCHES.push({id:"shop",name:"Workshop & hands",occ:"Carpenters",pay:"$60,580/yr",payN:60580,url:"https://www.bls.gov/ooh/construction-and-extraction/carpenters.htm",
 skills:[["shop_build","Studio & home builds"],["shop_wood","Woodworking"],["shop_labor","Manual labor"]]});
(function(){const L=window.BRANCHES.find(b=>b.id==='life');if(L)L.skills.push(["life_unstuck","Getting unstuck"]);
 const M=window.BRANCHES.find(b=>b.id==='mind');if(M)M.skills.push(["mind_attn","Attention & the Quiet"])})();

window.SHOP={
note:'Manual labor is one of the oldest remedies for the Nothing. The Ladder names psalmody and manual labor as the enemies of despondency. Hands on wood, something real gets finished, and the mind quiets.',
ladder:['The Ladder, Step 13: despondency and its remedies','https://christianity.redzambala.com/ladder-of-divine-ascent/ladder-of-divine-ascent-13.html'],
space:'Finish the panels in the garage now. Where they hang can wait. Wall panels are only 2 to 4 inches deep and use wall space, not floor space, so they cramp a room far less than they seem to while stacked in the garage.',
safety:['Gloves, long sleeves and long pants before you open the insulation.','Safety glasses when cutting. An N95 mask in a closed garage.','Cut with a serrated knife, not a power saw. Vacuum the scraps, do not sweep.','Rinse skin with cold water after. Wash work clothes on their own.'],
safetySrc:[['ROCKWOOL safe use sheet','https://www.rockwool.com/siteassets/o2-rockwool/documentation/safe-use-instruction-sheet/safe_use_instruction_sheet-rockwool.pdf'],['Johns Manville: keep insulation clean and dry','https://www.jm.com/content/dam/jm/global/en/insulation-systems/products/assets/installation-guide/bid-177-mineral-wool-installation-instructions-us.pdf']],
place:['First: the wall your mic faces, at mouth height.','Second: the wall behind your head. Your voice passes the mic, hits it and comes back in.','Then one panel each side, and one above the mic.','For a seated read, center panels about 3 to 4 feet off the floor.'],
placeSrc:[['Acoustic Sound Panels: placement for voiceover','https://acousticsoundpanels.com/pages/acoustic-panel-placement-guide'],['Burton Acoustix: how to build a panel','https://blog.burtonacoustix.com/acoustic-panels/diy-acoustic-panels']],
studio:{name:'Studio sound treatment',why:'A quiet, dry room for voice and chant. Half-width Rockwool panels: same height and depth as the first ones, half as wide, so they fit the tight spots.',where:'Decide later. Finish them in the garage first. Narrow panels fit beside the desk, next to a window or door frame, and in corners.',
 half:true,
 steps:['Measure one of the old panels: height, width, depth. Half the width is the new width. Write the three numbers down.',
 'Count what is in the garage: frame wood, Rockwool, fabric, hardware. One full-width batt makes two half-width panels.',
 'Clear one work spot in the garage: a table or two sawhorses.',
 'Put the safety kit where you work: gloves, glasses, N95, long sleeves.',
 'Cut the frame wood. Long sides: same as the old panels. End pieces: the new width minus two board thicknesses.',
 'Assemble each frame. Measure both diagonals; equal means square.',
 'Cut the Rockwool lengthwise down the middle with a bread knife along a straightedge, a little oversized so it friction-fits.',
 'Wrap the fabric: one staple in the center of each side, then outward every 2 to 3 inches. Fold corners like a gift.',
 'Put hanging hardware on the back: Z-clips or a French cleat.',
 'Store finished panels dry, wrapped, and off the concrete floor.',
 'Choose the spot: the wall the mic faces first, then the wall behind you. Use the narrow ones where a wide panel would not fit.',
 'Hang the first panel. Record the same line before and after.']},
ideas:[
 {n:'A gobo: a panel on feet',w:'A studio panel that stands and moves. It solves the "where does it go" problem by going wherever you record.',s:['Pick one finished panel to convert','Cut two feet from 2x4 scraps','Screw the feet to the bottom rail','Test it standing behind your chair']},
 {n:'Studio shelving',w:'On your prize list. Shelves make room instead of taking it, and full shelves soften the room.',s:['Measure the wall and the gear','Buy or cut the boards','Mount brackets into studs','Load it, heaviest at the bottom']},
 {n:'Icon corner shelf',w:'A small triangle shelf for a prayer corner. One afternoon, three pieces of wood.',s:['Cut a triangle top from one board','Cut two cleats','Sand and oil','Mount at eye height in the corner']},
 {n:'Olive oil tasting board',w:'A board with slots or rings for tasting cups, ready for your next tasting event.',s:['Pick a hardwood board','Mark cup positions','Drill or route the recesses','Sand and finish with food-safe oil']},
 {n:'Index-card box',w:'A simple open box for the card practice. Good first joinery project.',s:['Cut four sides and a bottom','Glue and nail the sides','Add the bottom','Sand the edges round']},
 {n:'Planter boxes for the plant sale',w:'Cedar boxes for propagated plants at church sales.',s:['Cut the sides from cedar fence boards','Screw the box together','Drill drain holes','Fill and plant']},
 {n:'Bread board',w:'A long board for serving bread and oil. Ties to the bread-and-balance track.',s:['Pick a board and cut to length','Shape a handle','Sand to 220','Oil, let dry, oil again']}],
labor:['Sweep the garage for 10 minutes','Sand one board by hand','Carry one load to the car for donation','Wash the car by hand','Rake or pull weeds for 15 minutes','Sharpen a knife or a chisel','Clean and oil one tool']
};

window.UNSTUCK={
note:'Boredom is an ally: empty time rebuilds attention. Inertia is the Nothing: things not done, branches gone gray. Name one tiny thing and do it, and the fog pulls back.',
gmork:['"The Nothing" is despair spreading through Fantasia (FEE)','https://fee.org/articles/confronting-the-nothing-the-true-moral-of-the-neverending-story/'],
good:'Write three things that went well today and why each happened. The why is the part that shows you that you caused them.',
goodSrc:['Three good things lifted mood for six months in a randomized trial (Seligman 2005)','https://wholebeinginstitute.com/wp-content/uploads/Positive-Psychology-Progress-Seligman-Steen-Park-Peterson-2005.pdf'],
quiet:'Phone in another room. Nothing to read, nothing to watch. Sit, look out a window, let the mind wander. If boredom arrives, that is the rep.',
quietSrc:['People found 15 quiet minutes hard enough to choose a mild shock instead (Wilson 2014)','https://www.sciencedaily.com/releases/2014/07/140703142154.htm'],
name:'Like Bastian naming the Empress: name one tiny action out loud, then give it 2 minutes. Starting is the whole job.',
baSrc:['Doing small valued actions first, mood second: behavioral activation (effect size 0.78)','https://psycnet.apa.org/fulltext/2009-20281-001.pdf'],
fogDays:14
};

window.UNSTUCK.seen={
why:'Inertia kept you safe from further judgment. That safety cost a smaller life. Fight it directly: do one thing where you could be judged, after writing down exactly what you think will happen. Then check.',
steps:['The thing: one act where you could be seen or judged.','The prediction: what exactly will happen? Make it something you could see or hear, like "they won\'t reply" or "they\'ll look away."','How sure are you, 0 to 100?','The hiding move to drop: over-preparing, softening, not sending, apologizing first.','Do it. Pay attention to them, not to yourself.','Afterward: what actually happened, and what did you learn?'],
src:[['Behavioral experiments: specific predictions, drop safety behaviors, compare to what happened (Cognitive Behaviour Therapy, 2025)','https://www.tandfonline.com/doi/abs/10.1080/16506073.2025.2518427'],['98% came across better than they predicted on video (Warnock-Parkes 2017)','https://pmc.ncbi.nlm.nih.gov/articles/PMC5627505/']],
ideas:['Send one job application without rewriting it a fourth time','Post the paper clip trade publicly','Send one olive oil follow-up','Show a finished panel to someone','Read one paragraph of your fiction to a friend','Post a 30-second voice clip','Ask a question you think is obvious','Chant one verse with someone listening'],
care:'If judgment fears ever get heavy enough to stop work or sleep, a counselor who does CBT can run these experiments with you. That is strength, not failure.'
};

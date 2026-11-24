/* Distill: big goals down to a first small step, and the steps back up to a maxim */
(function(){const m=window.BRANCHES.find(b=>b.id==='mind');if(m&&!m.skills.some(s=>s[0]==='mind_distill'))m.skills.push(['mind_distill','Distilling'])})();
window.DISTILL={
lede:'Two questions do all the work. Ask how? to go down to a step you can do today. Ask why? to go up to the principle under it. A principle grows stronger every time it shows up in a new goal.',
levels:[[1,'Hunch'],[2,'Pattern'],[3,'Principle']],
today:'Could you do this today, in under an hour, with what you already have?',
maxims:[
 {id:'small',text:'Sell something small',lede:'Small things sell fast, so you learn fast. Houses and solar were too big; pest control would have taught you more, sooner.',
  cues:['sell','sale','sales','import','business','launch','product','customer','customers','price','vending','concession','concessions','oil','olive','bottle','bottles','tour','trip','course','house','solar','market','store','shop','client','clients'],
  ask:['What is the smallest piece of this one person could buy this week?','What would the $5 to $20 version be?','Who could you sell it to without a pitch?']},
 {id:'test',text:'Test a few before you commit to many',lede:'Let the market pick the winners at small scale, then scale only what sold.',
  cues:['import','order','buy','inventory','wholesale','bulk','invest','scale','case','cases','container','stock','supplier','batch','event','events','tasting','tastings'],
  ask:['What is the smallest batch that would tell you if it works?','Which 3 to 5 versions could you put side by side?','What number would tell you it worked?']},
 {id:'have',text:'Start with what you already have',lede:'The vending machine dream became concessions out of the car you already drive.',
  cues:['start','build','make','studio','panel','panels','equipment','machine','car','uber','ride','rides','tools','space','room','garage','gear','money'],
  ask:['What do you already own, drive or know that could carry this?','Who do you already see every week who might want it?','What could you do with $0?']},
 {id:'ask',text:'Ask one person before you build',lede:'One real conversation beats a week of planning.',
  cues:['app','course','class','classes','website','site','teach','teaching','students','curriculum','book','podcast','program','service','offer','film'],
  ask:['Who is one person this is for? Ask them this week.','What could you show them that takes an hour to make?','What would they have to say for you to keep going?']},
 {id:'boring',text:'Shrink the first step until it is boring',lede:'If the first step still feels heavy, it is still too big. Make it so small it is almost silly.',
  cues:[],
  ask:['What could you do in 10 minutes?','What is the very first physical motion?','What would you do if you only had the energy of a heavy day?']}],
seed:{maxim:'small',evidence:['Selling houses and solar was too big. The advice was to sell something like pest control.','Concessions out of the Uber: the vending machine dream, made small.'],
 goal:{text:'Import my family’s olive oil',maxims:['small','test'],
  rungs:['Write a list of 3 to 5 bottles to test','Buy a few different bottles to test','Test-sell single bottles at a tasting event','Find which bottles sell','Sell the popular ones in bigger numbers','Import my family’s olive oil']}},
stop:'a an and the to of for in on at my me i im i’m we our with from by or be is it this that get go do up out into some more most just really want like make sure try trying need will would could should about over under one two three new',
src:[['Asking why? makes thinking more abstract; asking how? makes it concrete (Freitas, Gollwitzer and Trope 2004)','http://psychology.psy.sunysb.edu/afreitas-/publications/freitas_gollwitzer_trope2004.pdf'],
 ['Naming when, where and how had a medium-to-large effect on reaching goals across 94 studies (Gollwitzer and Sheeran 2006)','https://www.socmot.uni-konstanz.de/sites/default/files/06_Gollwitzer_Sheeran_Implementation_Intentions_And_Goal.pdf'],
 ['The smallest test that teaches you the most with the least effort (Eric Ries, minimum viable product)','https://en.wikipedia.org/wiki/Minimum_viable_product']]
};

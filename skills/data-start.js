/* Starting muscles: six things that block a start. Each has a fix for right now and a practice ladder. */
(function(){const p=window.BRANCHES.find(b=>b.id==='psych');if(p&&!p.skills.some(s=>s[0]==='psych_start'))p.skills.push(['psych_start','Starting muscles'])})();
window.START={
lede:'Name what is in the way, then use the fix. When you have a little extra, train it: five reps per level, five levels per muscle. Nothing here is a character flaw. These are how your brain starts things, and they can be worked with.',
per:5,
blocks:[
 {id:'init',name:'I can’t make the first move',sci:'Starting',fix:'First motion',
  fixHow:'Name the very first physical motion, count down from 5, and do only that. You can stop after 2 minutes.',
  levels:['Start a 2-minute task within 10 seconds of the countdown','Start a 10-minute task within 10 seconds','Start the task you have avoided longest, for 2 minutes','Start without the countdown: just the first motion','Start a dreaded task before anything else in the morning'],
  src:['Autistic adults describe inertia as real difficulty starting, and outside prompts as what helps (Buckle et al. 2021)','https://pmc.ncbi.nlm.nih.gov/articles/PMC8314008/']},
 {id:'wm',name:'Too much in my head',sci:'Working memory',fix:'Dump and show one',
  fixHow:'Write every step and worry down, one per line. The app hides everything except one. Do that, then see the next.',
  levels:['Dump for 2 minutes before any task with 3 or more steps','Write the steps on one index card before you start','Work from the card with the phone face down','Dump the whole day’s list at night, then close it','Run three tasks from one card without checking the phone'],
  note:'Memory games do not carry over to real life, so this muscle is the habit of getting it out of your head fast.',
  src:['Working memory training does not transfer to real-world skills (Melby-Lervåg, Redick and Hulme 2016)','https://pubmed.ncbi.nlm.nih.gov/27474138/']},
 {id:'decide',name:'I can’t choose',sci:'Deciding',fix:'Let the die pick',
  fixHow:'List the options. The app picks one. Do it for 10 minutes. If you feel relief at another option, do that one instead: that relief was your answer.',
  levels:['Make 3 small choices today in under 10 seconds each','Buy the first good-enough option on something under $20','Make a medium choice in 2 minutes on a timer','Make a choice and do not revisit it for 24 hours','Let a coin decide something you care about, and keep it'],
  src:['Good-enough choosers (satisficers) report less regret and more satisfaction than people who hunt for the best (Schwartz et al. 2002)','https://psycnet.apa.org/record/2002-18731-012']},
 {id:'reward',name:'It’s not worth it right now',sci:'Reward',fix:'Sweeten it',
  fixHow:'Pair it with something you want only while you do it: coffee, a podcast, a playlist. Starting is worth +2 right away.',
  levels:['Start with the treat already on','Earn the treat after 5 minutes of work','Earn it after 15 minutes','Earn it only when the step is done','Do one task with no treat, and notice the after-feeling'],
  src:['People who saved page-turner audiobooks for the gym went 51% more often at first (Milkman, Minson and Volpp 2014)','https://pmc.ncbi.nlm.nih.gov/articles/PMC4381662/']},
 {id:'trans',name:'I can’t stop what I’m doing',sci:'Switching',fix:'Soft landing',
  fixHow:'Set a landing time with a 5-minute and 1-minute warning. When it rings, write one parking line (where you stopped, what is next), then flip the Timeular and do the next first motion.',
  levels:['Stop at the bell once today, with the 5-minute warning','Stop at the bell with only the 1-minute warning','Stop something fun mid-chapter or mid-episode, with a parking line','Make three planned switches in one day','Switch with only the parking line, no warnings'],
  src:['Writing where you stopped and what is next reduces leftover attention on the old task (Leroy and Glomb 2018)','https://www.thewhyweproject.com/people/sophie-leroy']},
 {id:'perfect',name:'It has to be perfect',sci:'Perfectionism',fix:'Draft zero',
  fixHow:'Aim for a C+ version on purpose, with a short timer. Guess how bad it will feel, do it, then rate how bad it really was.',
  levels:['Do a 10-minute ugly first draft of something','Leave one small, harmless mistake in something','Show a B-minus thing to one person','Turn something in on time instead of perfect','Ask for feedback on an unfinished draft'],
  src:['CBT for perfectionism, built on small experiments like these, cut concern over mistakes across 15 trials (Galloway et al. 2022)','https://pubmed.ncbi.nlm.nih.gov/34346282/']}],
sweet:['A little coffee','A podcast or audiobook','A playlist','Sit somewhere nice','Text a friend while you start'],
bridge:['Flip the Timeular','Stand up','Drink water','Three slow breaths']
};

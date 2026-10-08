export type BuddyCharacter = 'veer' | 'siya';
export type TriggerType = 'water' | 'posture' | 'leetcode' | 'github' | 'random' | 'due_task';

export interface DialoguePayload {
  question: string;
  onYes: string;
  onNo: string;
}

export interface BuddyDialoguesMap {
  [key: string]: {
    veer: DialoguePayload[];
    siya: DialoguePayload[];
  };
}

export const BUDDY_DIALOGUES: BuddyDialoguesMap = {
  water: {
    veer: [
      {
        question: "Bhai table pe bottle showpiece ke liye sajai hai kya? Do ghoont paani pee, brain dehydrated ho chuka hai tera.",
        onYes: "Shabaash! Chal thoda dimaag chalega ab. Overconfident mat ho, kaam kar!",
        onNo: "Wah re camel! Jab kidney stone dard karega tab yaad aayegi meri. Main jaa raha hu wapas.",
      },
      {
        question: "Hydration check hero! Paani ka ghoont le le, warna agla bug fix nahi hone wala.",
        onYes: "Badhiya! Aise hi regular raha kar.",
        onNo: "Acha beta? Theek hai, agle 30 min me fir aake dimag khaunga.",
      },
    ],
    siya: [
      {
        question: "Listen! Pichle 1.5 ghante se ek drop paani nahi piya tune! Dehydration coding speed 15% gira deti hai, piyo jaldi!",
        onYes: "Good job! Aise hi hydration maintain kiya kar. Dekha na kitna fresh laga?",
        onNo: "Haye Rabba! Meri baat sunni hi nahi hoti kisi ko! Theek 20 min baad wapas aaungi, yaad rakhna!",
      },
      {
        question: "Hey Vedant! Bottle uthao aur 2 glass paani finish karo! Skin aur focus dono ke liye zaroori hai!",
        onYes: "Perfect! Aise disciplined banoge tabhi targets complete honge!",
        onNo: "Bilkul laparwah ho gaye ho! Theek hai, jaa rahi hu par gussa hu!",
      },
    ],
  },

  posture: {
    veer: [
      {
        question: "Kamar dekh apni, shrimp ban ke baitha hai chair pe! Seedha ho jaa warna 25 ki umar me physiotherapy leni padegi.",
        onYes: "Haan, ab thoda insaan lag raha hai. Chest out, focus on!",
        onNo: "Theek hai bhai, jhuke reh. Budhape me kamar dard ka blame mujh pe mat daalna.",
      },
    ],
    siya: [
      {
        question: "Posture check immediately! Spine 90 degrees pe rakho aur screen se 20 inch door! Back pain shuru hua na fir dekhna!",
        onYes: "Very good! Ergonomics are super important, aise hi straight baithna!",
        onNo: "Uff! Kitni stubborn ho! Doctor ke paas main nahi leke jaungi bata rahi hu!",
      },
    ],
  },

  leetcode: {
    veer: [
      {
        question: "Subah se IDE me ghoor raha hai, LeetCode pe ek submission nahi hua? Cursor ghoorne se placement nahi lagti bete.",
        onYes: "Zabardast! Green tick dekh ke dil khush ho gaya. Streak tootni nahi chahiye!",
        onNo: "Wah! Yahi umeed thi tere se. Main jaa raha hu, jab guilt trip shuru ho tab bula lena.",
      },
    ],
    siya: [
      {
        question: "Hey! LeetCode Daily Challenge pending dikh raha hai mujhe! Streak miss hui na toh pura graph kharab lagega, jaldi solve karo!",
        onYes: "Awesome! Problem solve ho gayi na? Proud of you, aise hi grind continue rakho!",
        onNo: "Kal bolte ho kal karunga, aaj bolte ho baad me! Discipline kaha gaya tumhara?",
      },
    ],
  },

  github: {
    veer: [
      {
        question: "GitHub ka heatmap abhi tak grey kyu pada hai? Ek commit push kar le hero, streak dekh ke recruiter impress hote hain.",
        onYes: "Commit push detect! Bas aise hi profile ko green rakhna hai roz.",
        onNo: "Theek hai bhai, streak tootegi toh tumhara nuksan hai. Main toh bas reminder tha.",
      },
    ],
    siya: [
      {
        question: "Daily GitHub push baaki hai! Code likha hai toh git push karne me sirf 10 seconds lagte hain, jaldi karo na please!",
        onYes: "Yay! Heatmap pe green dot aa gaya! Consistent coder mode on!",
        onNo: "Bas procrastination karwalo! Aisa karoge toh accountability buddy ka kya fayda?",
      },
    ],
  },

  random: {
    veer: [
      {
        question: "Mujhe ghoorne se pending tasks khatam nahi honge. Focus kar screen pe!",
        onYes: "Good, kaam pe dhyan de ab.",
        onNo: "Toh time waste kar maze se, deadline thodi rukegi.",
      },
    ],
    siya: [
      {
        question: "Main yahi observe kar rahi hu! Tab switch karke timepass mat karna, focus mode ON rakho!",
        onYes: "That's the spirit! Let's crush today's list!",
        onNo: "Pakad liya na distraction! Chalo jaldi kaam par wapas lago!",
      },
    ],
  },
};

// Helper: Random dialogue picker based on character & type
export function getBuddyDialogue(type: TriggerType, character: BuddyCharacter): DialoguePayload {
  const categoryPool = BUDDY_DIALOGUES[type] || BUDDY_DIALOGUES['random'];
  const pool = categoryPool[character] || categoryPool['veer'];
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
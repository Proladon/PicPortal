import { prettyLog } from 'pretty-browser-log'
const logger = prettyLog
logger.addManyLogStyles([
  {
    name: 'title',
    badge: 'Title:',
    badgeStyle: '',
    messageStyle: 'color:black;font-size:1rem;font-weight:bold;',
  },
  {
    name: 'danger',
    badge: 'Danger',
    badgeStyle: 'background-color:#ff6ea3; color:#525252; font-weight: 700;',
    messageStyle: 'color:#ff6ea3; font-weight: 700;',
  },
  {
    name: 'success',
    badge: 'Success',
    badgeStyle: 'background-color:#b1ff75; color:#525252; font-weight: 700;',
    messageStyle: 'color:#b1ff75;  font-weight: 700;',
  },
  {
    name: 'todo',
    badge: 'ToDo',
    badgeStyle: 'background-color:#ffcd78; color:#525252; font-weight: 700;',
    messageStyle: 'color:#ffcd78; font-weight: 700;',
  },
  {
    name: 'action',
    badge: 'Action',
    badgeStyle: 'background-color:#8accff; color:#525252; font-weight: 700;',
    messageStyle: 'color:#8accff; font-weight: 700;',
  },
  {
    name: 'info',
    badge: 'Action',
    badgeStyle: 'background-color:#525252; color:#F0F0F0; font-weight: 700;',
    messageStyle: 'color:#F0F0F0; font-weight: 700;',
  },
  {
    name: 'noLabel',
    badge: '',
    badgeStyle: 'border: 0',
    messageStyle:
      'color:#da91ff; border: 1px solid;border-radius:0.4rem;padding:2px 6px',
  },
  {
    name: 'dot',
    badge: '  ',
    badgeStyle: 'background-color:orange ;border-radius:50%',
    messageStyle: '',
  },

  // {name:'',badge:'',badgeStyle:'',messageStyle:''},
])

export default logger

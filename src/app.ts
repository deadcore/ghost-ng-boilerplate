import './compoents/infinite-scroll'

import { lazyLoad } from "fuse-tools";

window.ghost.modules.forEach(module => lazyLoad(module));
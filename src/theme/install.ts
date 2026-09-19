import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/noto-sans-sc/index.css';
import css from './workbench.css?inline';
// Legacy entry CSS is split into several production chunks. Install the adapter
// last so dev and production use the same cascade while those files migrate.
if(!document.getElementById('pvlane-design-system')){
 const style=document.createElement('style');style.id='pvlane-design-system';style.textContent=css;document.head.append(style);
}

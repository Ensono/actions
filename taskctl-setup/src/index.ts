/**
 * Setup taskctl Action
 *
 */
/* istanbul ignore next */ 
import { debug, setFailed } from "@actions/core"
/* istanbul ignore next */ 
import { runAction } from "./setup"
/* istanbul ignore next */ 
(async () => runAction()
.then((d) => debug(`taskctl downloaded and ready to use`))
.catch((ex) => setFailed(ex?.message)))()

import {useWorkspace} from '../../workspace/WorkspaceProvider';import OfficeApp from './OfficeApp';import CloudOffice from './CloudOffice';
export default function RouterOffice(){const {companyId}=useWorkspace();return companyId?<CloudOffice/>:<OfficeApp/>;}

// 타입 체크를 위해 임시 스텁으로 교체 (실제 페이지는 refactored 파일 참조)
// 빌드에서는 refactored 파일이 제외되어 있으므로 여기서 안전한 프록시 제공
import PointsManagement from './PointsManagement.refactored';
export default PointsManagement;

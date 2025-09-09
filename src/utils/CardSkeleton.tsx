import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const CardSkeleton = () => (
  <div className="p-2">
    <Skeleton height={120} />
    <div className="mt-2">
      <Skeleton count={2} />
    </div>
  </div>
);

export default CardSkeleton;
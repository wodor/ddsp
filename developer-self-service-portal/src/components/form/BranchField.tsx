/**
 * Branch selector field component
 */
import type { FormFieldSchema } from '../../utils/formSchemaParser';
import BranchSelector from './BranchSelector';

export interface BranchFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Branch selector field component that uses the enhanced BranchSelector
 */
const BranchField: React.FC<BranchFieldProps> = ({ field }) => {
  // We don't need to access errors here as they're handled in BranchSelector
  return <BranchSelector field={field} />;
};

export default BranchField;
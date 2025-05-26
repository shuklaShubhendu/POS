import { useState } from 'react';
import { X } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import Modal from '../ui/Modal';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({ isOpen, onClose }) => {
  const [sectionName, setSectionName] = useState('');
  const [error, setError] = useState('');
  const { menuSections, addMenuSection } = useMenu();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate section name
    const trimmedName = sectionName.trim();
    if (!trimmedName) {
      setError('Section name is required');
      return;
    }

    // Check if section name already exists
    const exists = menuSections.some(
      (section) => section.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setError('A section with this name already exists');
      return;
    }

    // Add the section
    addMenuSection(trimmedName);
    
    // Reset and close
    setSectionName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md mx-auto">
        <div className="flex justify-between items-center bg-red-600 text-white px-6 py-4">
          <h2 className="text-lg font-semibold">Add Menu Section</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700 mb-1">
              Section Name
            </label>
            <input
              id="sectionName"
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="input-field"
              placeholder="e.g., Appetizers, Main Course, Desserts"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddSectionModal;
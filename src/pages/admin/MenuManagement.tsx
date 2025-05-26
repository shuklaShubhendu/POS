import { useState } from 'react';
import { 
  PlusCircle, 
  Edit, 
  Trash, 
  UtensilsCrossed,
  Search
} from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import AddSectionModal from '../../components/modals/AddSectionModal';
import AddItemModal from '../../components/modals/AddItemModal';
import EditSectionModal from '../../components/modals/EditSectionModal';
import EditItemModal from '../../components/modals/EditItemModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import { MenuItem, MenuSection } from '../../types';

const MenuManagement = () => {
  const { 
    menuSections, 
    menuItems, 
    deleteMenuSection, 
    deleteMenuItem, 
    getMenuItemsBySection 
  } = useMenu();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  
  // Selected items for editing/deleting
  const [selectedSection, setSelectedSection] = useState<MenuSection | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deleteType, setDeleteType] = useState<'section' | 'item'>('item');
  
  // Get the current selected section
  const currentSection = menuSections.find(section => section.id === selectedSectionId);
  
  // Get items for the selected section or all items if no section is selected
  const displayedItems = selectedSectionId
    ? getMenuItemsBySection(selectedSectionId)
    : menuItems;
  
  // Filter items by search term
  const filteredItems = displayedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle section click
  const handleSectionClick = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSearchTerm('');
  };
  
  // Open edit section modal
  const handleEditSection = (section: MenuSection) => {
    setSelectedSection(section);
    setEditSectionModalOpen(true);
  };
  
  // Open edit item modal
  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setEditItemModalOpen(true);
  };
  
  // Open delete confirmation modal for section
  const handleDeleteSection = (section: MenuSection) => {
    setSelectedSection(section);
    setDeleteType('section');
    setDeleteConfirmModalOpen(true);
  };
  
  // Open delete confirmation modal for item
  const handleDeleteItem = (item: MenuItem) => {
    setSelectedItem(item);
    setDeleteType('item');
    setDeleteConfirmModalOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deleteType === 'section' && selectedSection) {
      deleteMenuSection(selectedSection.id);
      setSelectedSectionId(null);
    } else if (deleteType === 'item' && selectedItem) {
      deleteMenuItem(selectedItem.id);
    }
    
    setDeleteConfirmModalOpen(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        
        <div className="flex gap-3">
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setAddSectionModalOpen(true)}
          >
            <PlusCircle size={18} />
            Add Section
          </button>
          
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setAddItemModalOpen(true)}
          >
            <PlusCircle size={18} />
            Add Item
          </button>
        </div>
      </div>
      
      {/* Search and sections */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-3">Menu Sections</h2>
            <p className="text-sm text-gray-500 mb-4">
              Manage your menu categories. Click a section to view its items.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  !selectedSectionId 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
                onClick={() => setSelectedSectionId(null)}
              >
                All Items
              </button>
              
              {menuSections.map((section) => (
                <div key={section.id} className="flex items-center">
                  <button
                    className={`px-4 py-2 rounded-l-md transition-colors ${
                      selectedSectionId === section.id 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                    onClick={() => handleSectionClick(section.id)}
                  >
                    {section.name}
                  </button>
                  
                  <div className="flex">
                    <button
                      className="p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="p-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-r-md"
                      onClick={() => handleDeleteSection(section)}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="relative">
              <Search 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
        
        {/* Items list */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {currentSection 
              ? `Items in "${currentSection.name}"`
              : 'All Menu Items'}
          </h2>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <UtensilsCrossed size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm 
                  ? 'No items match your search' 
                  : 'No items in this section yet'}
              </p>
              <button 
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={() => setAddItemModalOpen(true)}
              >
                Add New Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="card overflow-hidden border border-gray-200">
                  <div className="h-40 bg-gray-200 overflow-hidden">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UtensilsCrossed size={40} />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <span className="text-red-600 font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <AddSectionModal 
        isOpen={addSectionModalOpen} 
        onClose={() => setAddSectionModalOpen(false)} 
      />
      
      <AddItemModal 
        isOpen={addItemModalOpen} 
        onClose={() => setAddItemModalOpen(false)} 
        preSelectedSectionId={selectedSectionId}
      />
      
      {selectedSection && (
        <EditSectionModal 
          isOpen={editSectionModalOpen} 
          onClose={() => setEditSectionModalOpen(false)} 
          section={selectedSection} 
        />
      )}
      
      {selectedItem && (
        <EditItemModal 
          isOpen={editItemModalOpen} 
          onClose={() => setEditItemModalOpen(false)} 
          item={selectedItem} 
        />
      )}
      
      <DeleteConfirmModal 
        isOpen={deleteConfirmModalOpen} 
        onClose={() => setDeleteConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteType === 'section' ? 'Section' : 'Item'}`}
        message={
          deleteType === 'section'
            ? 'Are you sure you want to delete this section? All items in this section will also be deleted.'
            : 'Are you sure you want to delete this item?'
        }
      />
    </div>
  );
};

export default MenuManagement;
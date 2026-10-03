import React, { useState } from 'react';
import { BookOpen, UserPlus, Search, Mail, Trash2, Edit2, Tag, Check, X, Send, Sparkles } from 'lucide-react';
import { ContactData } from '../lib/firestoreService';

interface AddressBookProps {
  contacts: ContactData[];
  onSaveContact: (contact: Omit<ContactData, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteContact: (contactId: string) => Promise<void>;
  onSelectCompose: (email: string) => void;
}

export const AddressBook: React.FC<AddressBookProps> = ({
  contacts,
  onSaveContact,
  onDeleteContact,
  onSelectCompose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'Work' | 'Personal' | 'VIP' | 'Client' | 'General'>('General');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', 'Work', 'Personal', 'VIP', 'Client', 'General'];

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setCategory('General');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: ContactData) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email);
    setCategory(c.category);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveContact({
        id: editingId || undefined,
        name: name.trim(),
        email: email.trim(),
        category,
        notes: notes.trim(),
      } as any);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'VIP': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Work': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'Client': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Personal': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Saved Address Book</h2>
            <p className="text-xs text-slate-400">
              Manage saved email contacts for quick attachment dispatch and transfers
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Contact</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-300">No saved contacts found</p>
          <p className="text-xs">Add new contacts to autocomplete their Gmail address instantly when transferring files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-4 shadow-xl transition flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{contact.name}</h3>
                      <p className="text-xs text-indigo-300 font-mono">{contact.email}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(contact.category)}`}>
                    {contact.category}
                  </span>
                </div>

                {contact.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                    {contact.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectCompose(contact.email)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compose Mail</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(contact)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Edit Contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingId ? 'Edit Address Book Contact' : 'Add New Contact'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Gmail Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.j@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Category Group</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white outline-none"
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="VIP">VIP</option>
                  <option value="Client">Client</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Tags</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Lead designer on Q4 project..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

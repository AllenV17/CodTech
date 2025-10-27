import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  ArrowLeft, 
  Save, 
  Users, 
  Share2, 
  Eye,
  EyeOff,
  MoreVertical,
  UserPlus,
  Settings
} from 'lucide-react';

const DocumentEditor = () => {
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState({ email: '', permissions: 'read' });
  
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const lastSavedContent = useRef('');
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    fetchDocument();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (socket && document) {
      socket.emit('join-document', document._id);
    }
  }, [socket, document]);

  const fetchDocument = async () => {
    try {
      const response = await axios.get(`/api/documents/${id}`);
      setDocument(response.data.document);
      setContent(response.data.document.content);
      lastSavedContent.current = response.data.document.content;
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('document-state', (state) => {
      if (state.content !== content) {
        setContent(state.content);
        lastSavedContent.current = state.content;
      }
    });

    newSocket.on('text-change', (data) => {
      if (data.userId !== user.id) {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const delta = quill.clipboard.convert(data.changes.content);
          quill.setContents(delta, 'api');
        }
      }
    });

    newSocket.on('user-typing', (data) => {
      // Handle typing indicators
      console.log('User typing:', data);
    });

    setSocket(newSocket);
  };

  const handleContentChange = (value, delta, source, editor) => {
    if (source === 'user') {
      setContent(value);
      
      // Emit changes to other users
      if (socket && document) {
        socket.emit('text-change', {
          documentId: document._id,
          changes: { content: value },
          userId: user.id
        });
      }

      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        window.isAutoSave = true;
        saveDocument().finally(() => {
          window.isAutoSave = false;
        });
      }, 2000);
    }
  };

  const saveDocument = async () => {
    // More robust content comparison
    const currentContent = content.trim();
    const lastSaved = lastSavedContent.current.trim();
    
    if (currentContent === lastSaved) {
      return; // No changes to save
    }

    // Prevent multiple simultaneous saves
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`/api/documents/${id}`, { content });
      lastSavedContent.current = content;
      
      // Only show success message if it's a manual save, not auto-save
      if (!window.isAutoSave) {
        toast.success('Document saved');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      
      // Only show error if it's a real error, not a network issue
      if (error.response?.status >= 500) {
        toast.error('Failed to save document');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('No permission to edit this document');
      } else if (error.response?.status === 404) {
        toast.error('Document not found');
      } else if (!error.response) {
        // Network error - don't show error toast for network issues
        console.log('Network error during save, will retry');
      }
    } finally {
      setSaving(false);
    }
  };

  const addCollaborator = async (e) => {
    e.preventDefault();
    
    try {
      // First, find user by email
      const userResponse = await axios.get(`/api/auth/by-email/${newCollaborator.email}`);
      const collaboratorUser = userResponse.data.user;

      const collaboratorResponse = await axios.post(`/api/documents/${id}/collaborators`, {
        userId: collaboratorUser._id,
        permissions: newCollaborator.permissions
      });

      toast.success('Collaborator added successfully');
      setShowShareModal(false);
      setNewCollaborator({ email: '', permissions: 'read' });
      fetchDocument();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      
      if (error.response?.status === 404) {
        toast.error('User not found with that email address');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid request');
      } else if (error.response?.status === 403) {
        toast.error('Only the document owner can add collaborators');
      } else {
        toast.error('Failed to add collaborator');
      }
    }
  };

  const toggleDocumentVisibility = async () => {
    try {
      await axios.put(`/api/documents/${id}`, {
        isPublic: !document.isPublic
      });
      setDocument({ ...document, isPublic: !document.isPublic });
      toast.success(`Document ${!document.isPublic ? 'made public' : 'made private'}`);
    } catch (error) {
      console.error('Error updating document visibility:', error);
      toast.error('Failed to update document visibility');
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Document not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {document.title}
                </h1>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Owner: {document.owner.username}</span>
                  {document.isPublic && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Public
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {saving && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  {window.isAutoSave ? 'Auto-saving...' : 'Saving...'}
                </div>
              )}
              
              <button
                onClick={() => {
                  window.isAutoSave = false;
                  saveDocument();
                }}
                className="btn btn-secondary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
              
              <button
                onClick={() => setShowCollaborators(!showCollaborators)}
                className="btn btn-secondary flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Collaborators ({document.collaborators.length + 1})
              </button>
              
              <button
                onClick={() => setShowShareModal(true)}
                className="btn btn-primary flex items-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              
              {document.owner._id === user.id && (
                <div className="relative">
                  <button
                    onClick={toggleDocumentVisibility}
                    className="btn btn-secondary flex items-center"
                  >
                    {document.isPublic ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {document.isPublic ? 'Make Private' : 'Make Public'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={handleContentChange}
            modules={modules}
            theme="snow"
            style={{ height: '70vh' }}
            placeholder="Start writing your document..."
          />
        </div>
      </div>

      {/* Collaborators Sidebar */}
      {showCollaborators && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l z-50">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Collaborators</h3>
              <button
                onClick={() => setShowCollaborators(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Owner */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {document.owner.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{document.owner.username}</p>
                  <p className="text-sm text-gray-500">Owner</p>
                </div>
              </div>
              
              {/* Collaborators */}
              {document.collaborators.map((collab) => (
                <div key={collab._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {collab.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{collab.user.username}</p>
                    <p className="text-sm text-gray-500 capitalize">{collab.permissions}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Collaborator
              </h3>
              
              <form onSubmit={addCollaborator}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="Enter collaborator's email"
                    value={newCollaborator.email}
                    onChange={(e) => setNewCollaborator({
                      ...newCollaborator,
                      email: e.target.value
                    })}
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <select
                    className="input"
                    value={newCollaborator.permissions}
                    onChange={(e) => setNewCollaborator({
                      ...newCollaborator,
                      permissions: e.target.value
                    })}
                  >
                    <option value="read">Read Only</option>
                    <option value="write">Read & Write</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Add Collaborator
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;

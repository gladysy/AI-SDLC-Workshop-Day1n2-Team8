import { describe, it, expect } from 'vitest';
import { templateDB, todoDB, subtaskDB, type CreateTemplateInput } from '@/lib/db';

describe('Template System', () => {
  const mockUserId = 1;

  describe('template CRUD', () => {
    it('should create a template with all fields', () => {
      const input: CreateTemplateInput & { user_id: number } = {
        user_id: mockUserId,
        name: 'Weekly Team Meeting',
        description: 'Team sync every Monday',
        category: 'Work',
        title_template: 'Team Meeting - Week #',
        priority: 'high',
        is_recurring: true,
        recurrence_pattern: 'weekly',
        reminder_minutes: 30,
        due_date_offset_minutes: 1440, // 1 day before
        subtasks: [
          { title: 'Review agenda', position: 0 },
          { title: 'Prepare updates', position: 1 },
        ],
      };

      const template = templateDB.create(input);

      expect(template.id).toBeGreaterThan(0);
      expect(template.name).toBe('Weekly Team Meeting');
      expect(template.description).toBe('Team sync every Monday');
      expect(template.category).toBe('Work');
      expect(template.is_recurring).toBe(true);
      expect(template.recurrence_pattern).toBe('weekly');
      expect(template.reminder_minutes).toBe(30);
    });

    it('should create a template with minimal fields', () => {
      const input: CreateTemplateInput & { user_id: number } = {
        user_id: mockUserId,
        name: 'Simple Todo',
        title_template: 'Do something',
      };

      const template = templateDB.create(input);

      expect(template.id).toBeGreaterThan(0);
      expect(template.name).toBe('Simple Todo');
      expect(template.title_template).toBe('Do something');
      expect(template.priority).toBe('medium'); // default
      expect(template.is_recurring).toBe(false); // default
    });

    it('should find template by id', () => {
      const input: CreateTemplateInput & { user_id: number } = {
        user_id: mockUserId,
        name: 'Findable Template',
        title_template: 'Test todo',
      };

      const created = templateDB.create(input);
      const found = templateDB.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Findable Template');
    });

    it('should find all templates for a user', () => {
      const userId = mockUserId;

      // Create multiple templates
      templateDB.create({
        user_id: userId,
        name: 'Template 1',
        title_template: 'Todo 1',
      });

      templateDB.create({
        user_id: userId,
        name: 'Template 2',
        title_template: 'Todo 2',
      });

      const templates = templateDB.findAllByUser(userId);

      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates.some((t) => t.name === 'Template 1')).toBe(true);
      expect(templates.some((t) => t.name === 'Template 2')).toBe(true);
    });

    it('should update a template', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Original Name',
        title_template: 'Original Title',
        description: 'Original description',
      });

      const updated = templateDB.update(template.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.title_template).toBe('Original Title'); // unchanged
    });

    it('should delete a template', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Template to Delete',
        title_template: 'To be deleted',
      });

      templateDB.delete(template.id);
      const found = templateDB.findById(template.id);

      expect(found).toBeNull();
    });

    it('should parse subtasks JSON correctly', () => {
      const subtasks = [
        { title: 'Step 1', position: 0 },
        { title: 'Step 2', position: 1 },
      ];

      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Template with Subtasks',
        title_template: 'Main task',
        subtasks,
      });

      expect(template.subtasks_json).not.toBeNull();

      const parsed = JSON.parse(template.subtasks_json!);
      expect(parsed).toEqual(subtasks);
    });
  });

  describe('template defaults', () => {
    it('should apply default priority (medium)', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Default Priority Test',
        title_template: 'Test',
      });

      expect(template.priority).toBe('medium');
    });

    it('should allow explicit priority override', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'High Priority Test',
        title_template: 'Test',
        priority: 'high',
      });

      expect(template.priority).toBe('high');
    });

    it('should default recurrence to false', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Non-Recurring',
        title_template: 'Test',
      });

      expect(template.is_recurring).toBe(false);
      expect(template.recurrence_pattern).toBeNull();
    });

    it('should store null for optional fields', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Minimal Template',
        title_template: 'Test',
      });

      expect(template.description).toBeNull();
      expect(template.category).toBeNull();
      expect(template.reminder_minutes).toBeNull();
      expect(template.due_date_offset_minutes).toBeNull();
    });
  });

  describe('template categories', () => {
    it('should store custom categories', () => {
      const categories = ['Work', 'Personal', 'Finance', 'Health', 'Custom Category'];

      categories.forEach((category) => {
        const template = templateDB.create({
          user_id: mockUserId,
          name: `Template in ${category}`,
          title_template: 'Test',
          category,
        });

        expect(template.category).toBe(category);
      });
    });
  });

  describe('template with recurring pattern', () => {
    it('should create template with daily recurrence', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Daily Standup',
        title_template: 'Standup - ',
        is_recurring: true,
        recurrence_pattern: 'daily',
      });

      expect(template.is_recurring).toBe(true);
      expect(template.recurrence_pattern).toBe('daily');
    });

    it('should create template with weekly recurrence', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Weekly Review',
        title_template: 'Weekly Review',
        is_recurring: true,
        recurrence_pattern: 'weekly',
      });

      expect(template.recurrence_pattern).toBe('weekly');
    });

    it('should create template with monthly recurrence', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Monthly Report',
        title_template: 'Monthly Report',
        is_recurring: true,
        recurrence_pattern: 'monthly',
      });

      expect(template.recurrence_pattern).toBe('monthly');
    });

    it('should create template with yearly recurrence', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Annual Review',
        title_template: 'Annual Review',
        is_recurring: true,
        recurrence_pattern: 'yearly',
      });

      expect(template.recurrence_pattern).toBe('yearly');
    });
  });

  describe('template due date offset', () => {
    it('should store due date offset in minutes', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Template with offset',
        title_template: 'Test',
        due_date_offset_minutes: 1440, // 1 day
      });

      expect(template.due_date_offset_minutes).toBe(1440);
    });

    it('should allow null due date offset', () => {
      const template = templateDB.create({
        user_id: mockUserId,
        name: 'Template without offset',
        title_template: 'Test',
        due_date_offset_minutes: null,
      });

      expect(template.due_date_offset_minutes).toBeNull();
    });
  });
});

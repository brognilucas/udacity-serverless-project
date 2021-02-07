import { TodoRepository } from '../repositories/TodoRepository'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate'
import * as uuid from 'uuid'
import { ImageService } from './imageService'

export class Todo {
  static async getTodos(userId: string): Promise<TodoItem[]> {
    const todoItems = await TodoRepository.getTodos(userId)

    for (const todoItem of todoItems) {
      delete todoItem.userId

      if (todoItem.hasUpload === true)
        todoItem.attachmentUrl = ImageService.getDownloadUrl(
          todoItem.todoId,
          userId
        )
    }

    return todoItems
  }

  static async createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
  ): Promise<TodoItem> {
    const itemId = uuid.v4()

    const todo = {
      todoId: itemId,
      userId: userId,
      name: createTodoRequest.name,
      dueDate: createTodoRequest.dueDate,
      done: false,
      attachmentUrl: null,
      createdAt: new Date().toISOString(),
      hasUpload: false
    }

    return await TodoRepository.createTodo(todo)
  }

  static async updateTodo(
    todoId: string,
    userId: string,
    updateTodoRequest: UpdateTodoRequest
  ): Promise<TodoUpdate> {
    return await TodoRepository.updateTodo(todoId, userId, {
      name: updateTodoRequest.name,
      dueDate: updateTodoRequest.dueDate,
      done: updateTodoRequest.done
    })
  }

  static async deleteTodo(todoId: string, userId: string): Promise<void> {
    await TodoRepository.deleteTodo(todoId, userId)
  }

  static async getTodo(todoId: string): Promise<TodoItem> {
    return await TodoRepository.getTodo(todoId)
  }

  static async updateImage(todoId: string, userId: string): Promise<void> {
    await TodoRepository.updateHasUpload(todoId, userId)
  }
}

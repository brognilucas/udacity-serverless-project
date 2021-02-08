import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoRepository {
  static readonly dynamoDB: DocumentClient = createDynamoDBClient()
  static readonly todoTable = process.env.TODOS_TABLE

  static async getTodos(userId: string): Promise<TodoItem[]> {
    const result = await this.dynamoDB
      .query({
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        TableName: this.todoTable
      })
      .promise()

    return result.Items as TodoItem[]
  }

  static async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.dynamoDB
      .put({
        TableName: this.todoTable,
        Item: todo
      })
      .promise()

    return todo
  }

  static async updateTodo(
    todoId: string,
    userId: string,
    todo: TodoUpdate
  ): Promise<TodoUpdate> {
    await this.dynamoDB
      .update({
        TableName: this.todoTable,
        Key: {
          todoId,
          userId
        },
        UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':name': todo.name,
          ':dueDate': todo.dueDate,
          ':done': todo.done,
          ':userId': userId
        },
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ConditionExpression: 'userId = :userId',
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    return todo
  }

  static async updateHasUpload(todoId: string, userId: string): Promise<void> {
    await this.dynamoDB
      .update({
        TableName: this.todoTable,
        Key: {
          todoId,
          userId
        },
        UpdateExpression: 'set hasUpload = :hasUpload',
        ExpressionAttributeValues: {
          ':hasUpload': true,
          ':userId': userId
        },
        ConditionExpression: 'userId = :userId',
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
  }

  static async deleteTodo(todoId: string, userId: string): Promise<void> {
    await this.dynamoDB
      .delete({
        TableName: this.todoTable,
        Key: {
          todoId,
          userId
        },
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ConditionExpression: 'userId = :userId'
      })
      .promise()
  }

  static async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    const result = await this.dynamoDB
      .get({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId
        }
      })
      .promise()

    return result.Item as TodoItem
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000',
      logger: console
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { Gender, User } from '../src/users/user.schema';
import { HttpExceptionFilter } from '../src/exceptions/http-exception.filter';
import { AllExceptionsFilter } from '../src/exceptions/all-exceptions.filter';

const tenDaysAgo = new Date();
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

const usersStub = [
  { name: 'John Doe', gender: Gender.MALE, hours: [{ value: 8, date: new Date() }, { value: 10, date: new Date() }, { value: 2, date: tenDaysAgo }] },
  { name: 'Danna Dee', gender: Gender.FEMALE, hours: [{ value: 5, date: new Date() }] }
]

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dbConnection: Connection;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
    await app.init();

    dbConnection = moduleFixture.get<DatabaseService>(DatabaseService).getDbHandle();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dbConnection.collection('users').deleteMany({});
  })

  describe('[GET]', () => {
    it('/api/v1/users', async () => {
      await dbConnection.collection('users').insertOne(usersStub[0]);
      await dbConnection.collection('users').insertOne(usersStub[1]);

      return request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body).toHaveLength(2);

          body.map((user, index) => {
            expect(user.name).toEqual(usersStub[index].name);
            expect(user.gender).toEqual(usersStub[index].gender);
            expect(user.totalHours).toEqual(usersStub[index].hours.length);
          })
        });
    });

    it('/api/v1/users/{:userId}', async () => {
      const user = await dbConnection.collection('users').insertOne(usersStub[0]);
      return request(app.getHttpServer())
        .get(`/api/v1/users/${user.insertedId}`)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.name).toEqual(usersStub[0].name);
          expect(body.gender).toEqual(usersStub[0].gender);

          // It does not return the hours older than past 7 days
          expect(body.hours).toHaveLength(2);
          body.hours.map(hour => {
            expect(hour.value).toBeGreaterThanOrEqual(0);
            expect(hour.date).toEqual((new Date(hour.date)).toISOString());
          });
        });
    });

    it('/api/v1/users/{:invalidId}', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/123')
        .expect(HttpStatus.BAD_REQUEST)
        .expect(({ body }) => {
          expect(body.statusCode).toEqual(HttpStatus.BAD_REQUEST);
          expect(body.messages).toEqual(['Invalid user ID']);
        });
    });

    it('/api/v1/users/{:notFoundId}', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/66197e41fdd10168e968c1b6')
        .expect(HttpStatus.NOT_FOUND)
        .expect(({ body }) => {
          expect(body.statusCode).toEqual(HttpStatus.NOT_FOUND);
          expect(body.messages).toEqual(['User not found']);
        });
    });
  });

  describe('[POST] /api/v1/users', () => {
    it('Create a new user', async () => {
      const newUser = { name: 'Jane Doe', gender: Gender.FEMALE, hours: [{ value: 8 }] };
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send(newUser)
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(body.name).toEqual(newUser.name);
          expect(body.gender).toEqual(newUser.gender);
          expect(body.hours).toHaveLength(1);
          expect(body.hours[0].value).toEqual(newUser.hours[0].value);
          expect(body.hours[0].date).toBeDefined();
        });
    });

    it('Append hours for existing user', async () => {
      const currentTotalHours = usersStub[0].hours.length;
      expect(usersStub[0].hours).toHaveLength(currentTotalHours);

      await dbConnection.collection('users').insertOne(usersStub[0]);

      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: usersStub[0].name,
          gender: usersStub[0].gender,
          hours: [{ value: 12 }]
        })
        .expect(HttpStatus.CREATED)
        .expect(({ body }) => {
          expect(body.name).toEqual(usersStub[0].name);
          expect(body.gender).toEqual(usersStub[0].gender);

          // Should append the new hour
          expect(body.hours).toHaveLength(currentTotalHours + 1);
        });
    });

    it('Cannot create user without required params', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          // name: usersStub[0].name,
          // gender: usersStub[0].gender,
          hours: [{ value: 12 }]
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect(({ body }) => {
          expect(body.statusCode).toEqual(400);
          expect(body.messages).toEqual([
            "gender: Path `gender` is required.",
            "name: Path `name` is required."
          ]);
        });
    });

    it('Cannot create user using invalid gender', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: usersStub[0].name,
          gender: 'Orange',
          hours: [{ value: 12 }]
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect(({ body }) => {
          expect(body.statusCode).toEqual(400);
          expect(body.messages).toEqual([
            "gender: `Orange` is not a valid enum value for path `gender`."
          ]);
        });
    });
  });
});

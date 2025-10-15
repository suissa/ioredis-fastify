import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';


interface IKeyParams { key: string; }
interface IGeoAddBody { locations: { longitude: number; latitude: number; member: string }[]; }
interface IGeoRadiusQuery {
  lon: number;
    lat: number;
      radius: number;
        unit: 'm' | 'km' | 'ft' | 'mi';
          withdist?: boolean;
            withcoord?: boolean;
              count?: number;
              }

              export function registerGeospatialRoutes(fastify: FastifyInstance, redis: Redis) {
                // Adiciona localizações geográficas
                  fastify.post<{ Params: IKeyParams; Body: IGeoAddBody }>('/geo/:key', async (request, reply) => {
                      try {
                            const { key } = request.params;
                                  const { locations } = request.body;
                                        if (!Array.isArray(locations) || locations.length === 0) {
                                                return reply.code(400).send({ error: 'O corpo deve conter um array "locations"' });
                                                      }
                                                            const args = locations.flatMap(l => [l.longitude, l.latitude, l.member]);
                                                                  const result = await redis.geoadd(key, ...args);
                                                                        reply.code(201).send({ status: 'OK', locationsAdded: result });
                                                                            } catch (err) {
                                                                                  fastify.log.error(err);
                                                                                        reply.code(500).send({ error: 'Erro Interno do Servidor' });
                                                                                            }
                                                                                              });

                                                                                                // Procura por membros dentro de um raio
                                                                                                  fastify.get<{ Params: IKeyParams; Querystring: IGeoRadiusQuery }>('/geo/:key/radius', async (request, reply) => {
                                                                                                      try {
                                                                                                            const { key } = request.params;
                                                                                                                  const { lon, lat, radius, unit, withdist, withcoord, count } = request.query;

                                                                                                                        const baseArgs: [number, number, number, 'm' | 'km' | 'ft' | 'mi'] = [lon, lat, radius, unit];
                                                                                                                              const extraArgs: (string | number)[] = [];

                                                                                                                                    if (withdist) extraArgs.push('WITHDIST');
                                                                                                                                          if (withcoord) extraArgs.push('WITHCOORD');
                                                                                                                                                if (count) extraArgs.push('COUNT', count);

                                                                                                                                                      const results = await redis.georadius(key, ...baseArgs, ...extraArgs);
                                                                                                                                                            reply.send({ results });
                                                                                                                                                                } catch (err) {
                                                                                                                                                                      fastify.log.error(err);
                                                                                                                                                                            reply.code(500).send({ error: 'Erro Interno do Servidor' });
                                                                                                                                                                                }
                                                                                                                                                                                  });
                                                                                                                                                                                  }
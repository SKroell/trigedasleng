import { useLoaderData } from "react-router";
import { prisma } from "../db.server";

export async function loader() {
  const sources = await prisma.source.findMany({
    orderBy: { date: 'desc' }
  });
  
  // Serialize date
  return { 
      sources: sources.map(s => ({
          ...s,
          date: s.date ? s.date.toISOString().split('T')[0] : ""
      })) 
  };
}

export default function Sources() {
    const { sources } = useLoaderData<typeof loader>();

    return (
        <div className="content">
            <div id="inner">
                <h1>All Sources</h1>
                { sources.map((source: any, index: number) =>
                    <p className="entry" key={index}>
                        {source.author} ({source.date}) <a href={source.url}>{source.title}</a>
                    </p>
                )
                }
            </div>
        </div>
    );
}
